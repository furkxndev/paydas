import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

import { PlatformRole, UserStatus } from '../common/enums';
import { AppConfig } from '../config/configuration';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { VerificationTokenType } from './entities/verification-token.entity';
import { TokenService } from './token.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

const PASSWORD_RESET_TTL_MINUTES = 60;
const EMAIL_VERIFICATION_TTL_MINUTES = 24 * 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
  ) {}

  private get jwtConfig() {
    return this.config.get<AppConfig['jwt']>('jwt')!;
  }

  /**
   * Refresh token üretilir, özeti saklanır; böylece çıkışta iptal edilebilir.
   *
   * Her token'a benzersiz bir jti eklenir: aynı saniyede imzalanan iki JWT
   * aksi halde birebir aynı olur (payload ile iat/exp aynı) ve özetleri çakışır.
   */
  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };
    const jwt = this.jwtConfig;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, jti: randomUUID() },
        { secret: jwt.secret, expiresIn: jwt.expiresIn },
      ),
      this.jwtService.signAsync(
        { ...payload, jti: randomUUID() },
        { secret: jwt.refreshSecret, expiresIn: jwt.refreshExpiresIn },
      ),
    ]);

    const decoded = this.jwtService.decode<{ exp: number }>(refreshToken);
    await this.tokens.storeRefreshToken(
      user.id,
      refreshToken,
      new Date(decoded.exp * 1000),
    );

    return { accessToken, refreshToken };
  }

  /**
   * Sistemdeki ilk kullanıcı otomatik olarak platform yöneticisi olur.
   * Sonraki kayıtlar normal kullanıcıdır.
   */
  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();
    if (await this.usersService.emailExists(email)) {
      throw new ConflictException(
        'Bu e-posta ile kayıtlı bir hesap zaten var.',
      );
    }

    const rounds = this.config.get<AppConfig['bcryptRounds']>('bcryptRounds')!;
    const isFirstUser = (await this.usersService.count()) === 0;

    const user = await this.usersService.create({
      fullName: dto.fullName.trim(),
      email,
      passwordHash: await bcrypt.hash(dto.password, rounds),
      platformRole: isFirstUser ? PlatformRole.ADMIN : PlatformRole.USER,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
    });

    await this.notifications.ensurePreferences(user.id);
    await this.sendEmailVerification(user);

    return { user, tokens: await this.issueTokens(user) };
  }

  private async sendEmailVerification(user: User): Promise<void> {
    const token = await this.tokens.issueVerificationToken(
      user.id,
      VerificationTokenType.EMAIL_VERIFICATION,
      EMAIL_VERIFICATION_TTL_MINUTES,
    );
    await this.mail.sendEmailVerification(user.email, user.fullName, token);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.usersService.findByEmail(dto.email);
    // Kullanıcı yoksa da aynı mesaj döner; hesap varlığı sızdırılmaz.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Hesabınız askıya alınmış. Yöneticiyle iletişime geçin.',
      );
    }

    const requireVerification = this.config.get<
      AppConfig['requireEmailVerification']
    >('requireEmailVerification')!;
    if (requireVerification && !user.emailVerifiedAt) {
      throw new ForbiddenException(
        'E-posta adresinizi doğrulamanız gerekiyor. Gelen kutunuzu kontrol edin.',
      );
    }

    await this.usersService.touchLastLogin(user.id);
    await this.notifications.ensurePreferences(user.id);

    return { user, tokens: await this.issueTokens(user) };
  }

  /**
   * Erişim token'ını yeniler ve refresh token'ı döndürür (rotasyon).
   * Kullanılan token iptal edilir; çalınan eski bir token tekrar kullanılamaz.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: this.jwtConfig.refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
      );
    }

    if (!(await this.tokens.isRefreshTokenActive(refreshToken))) {
      throw new UnauthorizedException(
        'Oturum geçersiz. Lütfen tekrar giriş yapın.',
      );
    }

    const user = await this.usersService.getById(payload.sub);
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Hesabınız askıya alınmış.');
    }

    await this.tokens.revokeRefreshToken(refreshToken);
    return this.issueTokens(user);
  }

  /** Çıkış: verilen refresh token iptal edilir, oturum gerçekten kapanır */
  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) await this.tokens.revokeRefreshToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
  }

  /**
   * Şifre sıfırlama talebi.
   * Hesabın var olup olmadığı sızdırılmaz; her durumda aynı yanıt döner.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.status === UserStatus.SUSPENDED) return;

    const token = await this.tokens.issueVerificationToken(
      user.id,
      VerificationTokenType.PASSWORD_RESET,
      PASSWORD_RESET_TTL_MINUTES,
    );
    await this.mail.sendPasswordReset(user.email, user.fullName, token);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const userId = await this.tokens.consumeVerificationToken(
      dto.token,
      VerificationTokenType.PASSWORD_RESET,
    );
    if (!userId) {
      throw new BadRequestException(
        'Sıfırlama bağlantısı geçersiz ya da süresi dolmuş.',
      );
    }

    const rounds = this.config.get<AppConfig['bcryptRounds']>('bcryptRounds')!;
    const user = await this.usersService.getById(userId);
    user.passwordHash = await bcrypt.hash(dto.password, rounds);
    await this.usersService.save(user);

    // Şifre değişince tüm oturumlar kapatılır
    await this.tokens.revokeAllForUser(userId);
  }

  async changePassword(user: User, dto: ChangePasswordDto): Promise<void> {
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Mevcut şifreniz hatalı.');
    }
    const rounds = this.config.get<AppConfig['bcryptRounds']>('bcryptRounds')!;
    user.passwordHash = await bcrypt.hash(dto.newPassword, rounds);
    await this.usersService.save(user);
    await this.tokens.revokeAllForUser(user.id);
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.tokens.consumeVerificationToken(
      token,
      VerificationTokenType.EMAIL_VERIFICATION,
    );
    if (!userId) {
      throw new BadRequestException(
        'Doğrulama bağlantısı geçersiz ya da süresi dolmuş.',
      );
    }
    const user = await this.usersService.getById(userId);
    user.emailVerifiedAt = new Date();
    await this.usersService.save(user);
  }

  async resendVerification(user: User): Promise<void> {
    if (user.emailVerifiedAt) return;
    await this.sendEmailVerification(user);
  }
}
