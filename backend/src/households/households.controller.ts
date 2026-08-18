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
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  CreateHouseholdDto,
  JoinHouseholdDto,
  UpdateHouseholdDto,
} from './dto';
import { Household } from './entities/household.entity';
import {
  HouseholdSummary,
  HouseholdSummaryService,
} from './household-summary.service';
import { HouseholdsService } from './households.service';

@Controller('households')
export class HouseholdsController {
  constructor(
    private readonly householdsService: HouseholdsService,
    private readonly summaryService: HouseholdSummaryService,
  ) {}

  @Get()
  list(@CurrentUser('id') userId: string): Promise<Household[]> {
    return this.householdsService.listForUser(userId);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateHouseholdDto,
  ): Promise<Household> {
    return this.householdsService.create(user, dto);
  }

  @Post('join')
  join(
    @CurrentUser() user: User,
    @Body() dto: JoinHouseholdDto,
  ): Promise<Household> {
    return this.householdsService.join(user, dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Household> {
    return this.householdsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateHouseholdDto,
  ): Promise<Household> {
    return this.householdsService.update(id, userId, dto);
  }

  @Post(':id/invite-code')
  regenerateInviteCode(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Household> {
    return this.householdsService.regenerateInviteCode(id, userId);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser('id') userId: string,
  ): Promise<Household> {
    return this.householdsService.removeMember(id, userId, targetUserId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.householdsService.leave(id, userId);
  }

  @Get(':id/summary')
  summary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<HouseholdSummary> {
    return this.summaryService.build(id, userId);
  }
}
