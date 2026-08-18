import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Expense } from '../expenses/entities/expense.entity';
import { HouseholdsModule } from '../households/households.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';
import { Settlement } from './entities/settlement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement, Expense]),
    HouseholdsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [BalancesController],
  providers: [BalancesService],
  exports: [BalancesService, TypeOrmModule],
})
export class BalancesModule {}
