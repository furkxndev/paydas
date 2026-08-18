import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminQueryUsersDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['all', 'admin', 'user'])
  role?: 'all' | 'admin' | 'user';

  @IsOptional()
  @IsIn(['all', 'active', 'suspended'])
  status?: 'all' | 'active' | 'suspended';
}
