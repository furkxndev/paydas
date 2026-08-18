import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateHouseholdDto {
  @IsString()
  @MinLength(2, { message: 'Ev adı en az 2 karakter olmalı' })
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;

  @IsOptional()
  @IsIn(['TRY', 'USD', 'EUR', 'GBP'])
  currency?: string;
}
