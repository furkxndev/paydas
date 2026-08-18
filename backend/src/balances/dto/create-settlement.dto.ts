import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSettlementDto {
  @IsUUID()
  fromUserId: string;

  @IsUUID()
  toUserId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Tutar 0’dan büyük olmalı' })
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string;
}
