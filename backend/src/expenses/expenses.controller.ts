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
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateExpenseDto, QueryExpensesDto, UpdateExpenseDto } from './dto';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';

@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('households/:householdId/expenses')
  list(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser('id') userId: string,
    @Query() query: QueryExpensesDto,
  ): Promise<Expense[]> {
    return this.expensesService.list(householdId, userId, query);
  }

  @Post('households/:householdId/expenses')
  create(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateExpenseDto,
  ): Promise<Expense> {
    return this.expensesService.create(householdId, user, dto);
  }

  @Get('expenses/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Expense> {
    return this.expensesService.findOne(id, userId);
  }

  @Patch('expenses/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<Expense> {
    return this.expensesService.update(id, userId, dto);
  }

  @Delete('expenses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.expensesService.remove(id, userId);
  }
}
