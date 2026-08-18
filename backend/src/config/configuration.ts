import type ms from 'ms';

/**
 * Ortam değişkenlerinden okunan uygulama yapılandırması.
 * Gizli bilgiler kod içinde tutulmaz; tümü .env üzerinden gelir (bkz. .env.example).
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    synchronize: boolean;
    logging: boolean;
  };
  jwt: {
    secret: string;
    /** "7d", "15m" gibi süre ifadesi (jsonwebtoken/ms biçimi) */
    expiresIn: ms.StringValue;
    refreshSecret: string;
    refreshExpiresIn: ms.StringValue;
  };
  bcryptRounds: number;
  /** Şifre sıfırlama bağlantılarında kullanılan genel adres */
  appUrl: string;
  /** Kayıt sonrası e-posta doğrulaması zorunlu olsun mu */
  requireEmailVerification: boolean;
  smtp: {
    host?: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
    from: string;
  };
  throttle: {
    /** Genel istek limiti (dakikada) */
    limit: number;
    /** Giriş/kayıt uçları için daha sıkı limit (dakikada) */
    authLimit: number;
  };
  /** Expo push bildirimleri için erişim anahtarı (isteğe bağlı) */
  expoAccessToken?: string;
  /** Fatura hatırlatmalarının çalıştığı saat (0-23) */
  reminderHour: number;
}

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((o) => o.trim()),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: toNumber(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME ?? 'paydas',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'paydas',
    // Üretimde kapalı olmalı; şema değişiklikleri migration ile yönetilir.
    synchronize: toBool(
      process.env.DB_SYNCHRONIZE,
      process.env.NODE_ENV !== 'production',
    ),
    logging: toBool(process.env.DB_LOGGING, false),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    // Ortam değişkeni serbest metindir; biçim doğrulaması jsonwebtoken tarafında yapılır
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as ms.StringValue,
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
      '30d') as ms.StringValue,
  },
  bcryptRounds: toNumber(process.env.BCRYPT_ROUNDS, 10),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  requireEmailVerification: toBool(
    process.env.REQUIRE_EMAIL_VERIFICATION,
    false,
  ),
  smtp: {
    host: process.env.SMTP_HOST || undefined,
    port: toNumber(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || undefined,
    password: process.env.SMTP_PASSWORD || undefined,
    from: process.env.SMTP_FROM ?? 'Paydaş <noreply@paydas.app>',
  },
  throttle: {
    limit: toNumber(process.env.THROTTLE_LIMIT, 120),
    authLimit: toNumber(process.env.THROTTLE_AUTH_LIMIT, 10),
  },
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
  reminderHour: toNumber(process.env.REMINDER_HOUR, 10),
});
