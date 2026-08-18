import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, LessThan, Repository } from 'typeorm';

import { RefreshToken } from './entities/refresh-token.entity';
import {
  VerificationToken,
  VerificationTokenType,
} from './entities/verification-token.entity';

/** Ham token yerine özeti saklanır; veritabanı sızsa bile token kullanılamaz */
const hash = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(VerificationToken)
    private readonly verificationTokens: Repository<VerificationToken>,
  ) {}

  // --- Refresh token'lar ---

  async storeRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.refreshTokens.save(
      this.refreshTokens.create({ userId, tokenHash: hash(token), expiresAt }),
    );
  }

  /** Token kayıtlı, iptal edilmemiş ve süresi dolmamış mı */
  async isRefreshTokenActive(token: string): Promise<boolean> {
    const record = await this.refreshTokens.findOne({
      where: { tokenHash: hash(token) },
    });
    if (!record || record.revokedAt) return false;
    return record.expiresAt.getTime() > Date.now();
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokens.update(
      { tokenHash: hash(token), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /** Çıkışta ve şifre değişiminde kullanıcının tüm oturumlarını kapatır */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  // --- Doğrulama / sıfırlama token'ları ---

  /** Ham token yalnızca burada döner; veritabanına özeti yazılır */
  async issueVerificationToken(
    userId: string,
    type: VerificationTokenType,
    ttlMinutes: number,
  ): Promise<string> {
    // Aynı türdeki eski token'lar geçersiz kılınır
    await this.verificationTokens.update(
      { userId, type, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const token = randomBytes(32).toString('hex');
    await this.verificationTokens.save(
      this.verificationTokens.create({
        userId,
        type,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      }),
    );
    return token;
  }

  /** Geçerliyse token'ı tüketir ve kullanıcı id'sini döner */
  async consumeVerificationToken(
    token: string,
    type: VerificationTokenType,
  ): Promise<string | null> {
    const record = await this.verificationTokens.findOne({
      where: { tokenHash: hash(token), type },
    });
    if (!record || record.usedAt) return null;
    if (record.expiresAt.getTime() < Date.now()) return null;

    record.usedAt = new Date();
    await this.verificationTokens.save(record);
    return record.userId;
  }

  /** Süresi dolmuş kayıtları temizler (zamanlanmış görev çağırır) */
  async purgeExpired(): Promise<number> {
    const now = new Date();
    const [refresh, verification] = await Promise.all([
      this.refreshTokens.delete({ expiresAt: LessThan(now) }),
      this.verificationTokens.delete({ expiresAt: LessThan(now) }),
    ]);
    return (refresh.affected ?? 0) + (verification.affected ?? 0);
  }
}
