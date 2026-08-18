import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { BillRecurrence, BillType } from '../../common/enums';

export class CreateBillDto {
  @IsString()
  @MinLength(2, { message: 'Fatura adı en az 2 karakter olmalı' })
  @MaxLength(150)
  name: string;

  @IsEnum(BillType)
  type: BillType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Tutar 0’dan büyük olmalı' })
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsEnum(BillRecurrence)
  recurrence: BillRecurrence;

  /** Boş bırakılırsa tüm ev üyeleri paylaşır */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  participantIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  reminderDaysBefore?: number;

  @IsOptional()
  @IsBoolean()
  autoCreateExpense?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
