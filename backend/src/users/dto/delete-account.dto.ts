import { IsString, MinLength } from 'class-validator';

/** Hesap silme geri alınamaz olduğu için şifre teyidi istenir */
export class DeleteAccountDto {
  @IsString()
  @MinLength(1, { message: 'Şifrenizi girmelisiniz' })
  password: string;
}
