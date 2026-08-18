import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';

import { ChoreStatus } from '../../common/enums';
import { CreateChoreDto } from './create-chore.dto';

export class UpdateChoreDto extends PartialType(CreateChoreDto) {
  @IsOptional()
  @IsEnum(ChoreStatus)
  status?: ChoreStatus;
}
