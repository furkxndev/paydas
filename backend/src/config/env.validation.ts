import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Uygulama açılırken ortam değişkenlerini doğrular.
 * Eksik/zayıf bir gizli anahtarla sessizce başlamak yerine erken hata verilir.
 */
class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsString()
  @IsNotEmpty({ message: 'DB_HOST tanımlanmalı' })
  DB_HOST!: string;

  @IsNumberString()
  DB_PORT!: string;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME!: string;

  @IsString()
  @IsNotEmpty({ message: 'DB_PASSWORD tanımlanmalı' })
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET en az 32 karakter olmalı' })
  JWT_SECRET!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET en az 32 karakter olmalı' })
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  EXPO_ACCESS_TOKEN?: string;
}

export const validateEnv = (config: Record<string, unknown>) => {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('\n  - ');
    throw new Error(
      `Ortam değişkenleri geçersiz:\n  - ${messages}\n\n.env.example dosyasına bakın.`,
    );
  }
  return config;
};
