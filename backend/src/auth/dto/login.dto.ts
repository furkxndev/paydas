import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta girin' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Şifre zorunludur' })
  password: string;
}
