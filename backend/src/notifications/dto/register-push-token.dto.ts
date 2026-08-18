import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DevicePlatform } from '../../common/enums';

export class RegisterPushTokenDto {
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  token: string;

  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;
}
