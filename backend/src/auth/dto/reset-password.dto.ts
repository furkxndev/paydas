import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(20, { message: 'Sıfırlama bağlantısı geçersiz' })
  token: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  @MaxLength(72)
  password: string;
}
