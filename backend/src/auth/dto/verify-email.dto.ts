import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(20, { message: 'Doğrulama bağlantısı geçersiz' })
  token: string;
}
