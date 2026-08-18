import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Ad soyad en az 2 karakter olmalı' })
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta girin' })
  @MaxLength(180)
  email: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  @MaxLength(72)
  password: string;
}
