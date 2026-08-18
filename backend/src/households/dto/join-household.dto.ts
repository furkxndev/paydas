import { IsString, Length } from 'class-validator';

export class JoinHouseholdDto {
  @IsString()
  @Length(6, 12, { message: 'Davet kodu 6 karakter olmalı' })
  inviteCode: string;
}
