import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ExpenseCategory, SplitType } from '../../common/enums';

export class ExpenseShareDto {
  @IsUUID()
  userId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  weight?: number;
}

export class CreateExpenseDto {
  @IsString()
  @MinLength(2, { message: 'Başlık en az 2 karakter olmalı' })
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Tutar 0’dan büyük olmalı' })
  amount: number;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsUUID()
  paidBy: string;

  @IsDateString()
  date: string;

  @IsEnum(SplitType)
  splitType: SplitType;

  /** Verilirse doğrudan kullanılır; toplamı tutara eşit olmalıdır */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseShareDto)
  shares?: ExpenseShareDto[];

  /** shares verilmezse bu üyeler arasında eşit bölüşülür */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  participantIds?: string[];

  @IsOptional()
  @IsUUID()
  billId?: string;
}
