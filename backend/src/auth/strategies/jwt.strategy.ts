import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserStatus } from '../../common/enums';
import { UsersService } from '../../users/users.service';
import { AppConfig } from '../../config/configuration';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<AppConfig['jwt']>('jwt')!.secret,
    });
  }

  /** Token geçerli olsa bile kullanıcı silinmiş ya da askıya alınmış olabilir */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user)
      throw new UnauthorizedException(
        'Oturum geçersiz. Lütfen tekrar giriş yapın.',
      );
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Hesabınız askıya alınmış. Yöneticiyle iletişime geçin.',
      );
    }
    return user;
  }
}
