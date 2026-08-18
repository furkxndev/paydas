import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';
import { User } from '../users/entities/user.entity';
import {
  AdminHouseholdSummary,
  AdminService,
  AdminStats,
  AdminUserSummary,
} from './admin.service';
import { AdminQueryUsersDto, AdminUpdateUserDto } from './dto';

/** Tüm uçlar platform yöneticisi yetkisi ister */
@UseGuards(PlatformAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats(): Promise<AdminStats> {
    return this.adminService.stats();
  }

  @Get('users')
  listUsers(@Query() query: AdminQueryUsersDto): Promise<AdminUserSummary[]> {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  getUser(@Param('id', ParseUUIDPipe) id: string): Promise<AdminUserSummary> {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<User> {
    return this.adminService.updateUser(actor, id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.adminService.deleteUser(actor, id);
  }

  @Get('households')
  listHouseholds(): Promise<AdminHouseholdSummary[]> {
    return this.adminService.listHouseholds();
  }
}
