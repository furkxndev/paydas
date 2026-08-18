import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class PayBillDto {
  @IsUUID()
  paidBy: string;

  /** Fiili ödenen tutar; verilmezse faturanın tutarı kullanılır */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
