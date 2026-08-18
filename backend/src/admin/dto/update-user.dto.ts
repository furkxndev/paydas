import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PlatformRole, UserStatus } from '../../common/enums';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Ad soyad en az 2 karakter olmalı' })
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEnum(PlatformRole)
  platformRole?: PlatformRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
