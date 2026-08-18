import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Settlement } from '../balances/entities/settlement.entity';
import { Bill } from '../bills/entities/bill.entity';
import { Chore } from '../chores/entities/chore.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { HouseholdMember } from './entities/household-member.entity';
import { Household } from './entities/household.entity';
import { HouseholdSummaryService } from './household-summary.service';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';

@Module({
  imports: [
    // Özet servisi diğer modüllerin depolarını doğrudan okur (döngüsel bağımlılık olmaz)
    TypeOrmModule.forFeature([
      Household,
      HouseholdMember,
      Expense,
      Bill,
      Chore,
      Settlement,
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [HouseholdsController],
  providers: [HouseholdsService, HouseholdSummaryService],
  exports: [HouseholdsService, TypeOrmModule],
})
export class HouseholdsModule {}
