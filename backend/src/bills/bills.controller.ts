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
import { BillsService } from './bills.service';
import { CreateBillDto, PayBillDto, UpdateBillDto } from './dto';
import { Bill } from './entities/bill.entity';

@Controller()
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get('households/:householdId/bills')
  list(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser('id') userId: string,
  ): Promise<Bill[]> {
    return this.billsService.list(householdId, userId);
  }

  @Post('households/:householdId/bills')
  create(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateBillDto,
  ): Promise<Bill> {
    return this.billsService.create(householdId, user, dto);
  }

  @Get('bills/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Bill> {
    return this.billsService.findOne(id, userId);
  }

  @Patch('bills/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBillDto,
  ): Promise<Bill> {
    return this.billsService.update(id, userId, dto);
  }

  @Post('bills/:id/pay')
  pay(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: PayBillDto,
  ): Promise<Bill> {
    return this.billsService.pay(id, user, dto);
  }

  @Delete('bills/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.billsService.remove(id, userId);
  }
}
