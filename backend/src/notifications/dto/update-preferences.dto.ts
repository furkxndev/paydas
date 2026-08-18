import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsBoolean() billReminders?: boolean;
  @IsOptional() @IsBoolean() expenseAlerts?: boolean;
  @IsOptional() @IsBoolean() choreReminders?: boolean;
  @IsOptional() @IsBoolean() settlementAlerts?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  reminderHour?: number;
}
