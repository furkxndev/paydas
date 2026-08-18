import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExpensesModule } from '../expenses/expenses.module';
import { HouseholdsModule } from '../households/households.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { Bill } from './entities/bill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill]),
    HouseholdsModule,
    NotificationsModule,
    ExpensesModule,
    UsersModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService, TypeOrmModule],
})
export class BillsModule {}
