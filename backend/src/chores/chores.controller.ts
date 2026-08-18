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
import { ChoresService } from './chores.service';
import { CreateChoreDto, UpdateChoreDto } from './dto';
import { Chore } from './entities/chore.entity';

@Controller()
export class ChoresController {
  constructor(private readonly choresService: ChoresService) {}

  @Get('households/:householdId/chores')
  list(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser('id') userId: string,
  ): Promise<Chore[]> {
    return this.choresService.list(householdId, userId);
  }

  @Post('households/:householdId/chores')
  create(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateChoreDto,
  ): Promise<Chore> {
    return this.choresService.create(householdId, user, dto);
  }

  @Patch('chores/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateChoreDto,
  ): Promise<Chore> {
    return this.choresService.update(id, user, dto);
  }

  @Post('chores/:id/complete')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Chore> {
    return this.choresService.setCompleted(id, user, true);
  }

  @Post('chores/:id/reopen')
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Chore> {
    return this.choresService.setCompleted(id, user, false);
  }

  @Delete('chores/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.choresService.remove(id, userId);
  }
}
