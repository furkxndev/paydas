import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BillsModule } from '../bills/bills.module';
import { ChoresModule } from '../chores/chores.module';
import { HouseholdsModule } from '../households/households.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RemindersService } from './reminders.service';

@Module({
  imports: [
    AuthModule,
    BillsModule,
    ChoresModule,
    HouseholdsModule,
    NotificationsModule,
  ],
  providers: [RemindersService],
})
export class RemindersModule {}
