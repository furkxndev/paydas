import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Settlement } from '../balances/entities/settlement.entity';
import { Bill } from '../bills/entities/bill.entity';
import { Chore } from '../chores/entities/chore.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { HouseholdMember } from '../households/entities/household-member.entity';
import { Household } from '../households/entities/household.entity';
import { User } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Household,
      HouseholdMember,
      Expense,
      Bill,
      Chore,
      Settlement,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
