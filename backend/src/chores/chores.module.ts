import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HouseholdsModule } from '../households/households.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChoresController } from './chores.controller';
import { ChoresService } from './chores.service';
import { Chore } from './entities/chore.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chore]),
    HouseholdsModule,
    NotificationsModule,
  ],
  controllers: [ChoresController],
  providers: [ChoresService],
  exports: [ChoresService, TypeOrmModule],
})
export class ChoresModule {}
