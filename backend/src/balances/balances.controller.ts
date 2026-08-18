import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BalancesResult, BalancesService } from './balances.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { Settlement } from './entities/settlement.entity';

@Controller('households/:householdId')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('balances')
  get(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser('id') userId: string,
  ): Promise<BalancesResult> {
    return this.balancesService.get(householdId, userId);
  }

  @Get('settlements')
  listSettlements(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser('id') userId: string,
  ): Promise<Settlement[]> {
    return this.balancesService.listSettlements(householdId, userId);
  }

  @Post('settlements')
  settle(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateSettlementDto,
  ): Promise<Settlement> {
    return this.balancesService.settle(householdId, user, dto);
  }
}
