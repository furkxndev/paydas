import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { ChorePriority, ChoreRecurrence } from '../../common/enums';

export class CreateChoreDto {
  @IsString()
  @MinLength(2, { message: 'Görev başlığı en az 2 karakter olmalı' })
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /** null gönderilirse görev havuzda bekler */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  assignedTo?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(ChorePriority)
  priority?: ChorePriority;

  @IsOptional()
  @IsEnum(ChoreRecurrence)
  recurrence?: ChoreRecurrence;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  points?: number;
}
