import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { BalancesModule } from './balances/balances.module';
import { BillsModule } from './bills/bills.module';
import { ChoresModule } from './chores/chores.module';
import { AppConfig } from './config/configuration';
import configuration from './config/configuration';
import { buildTypeOrmOptions } from './config/database.config';
import { validateEnv } from './config/env.validation';
import { ExpensesModule } from './expenses/expenses.module';
import { HealthModule } from './health/health.module';
import { HouseholdsModule } from './households/households.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RemindersModule } from './reminders/reminders.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    // Kaba kuvvet ve kötüye kullanıma karşı istek limiti
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60_000,
          limit: config.get<AppConfig['throttle']>('throttle')!.limit,
        },
      ],
    }),
    ScheduleModule.forRoot(),

    MailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    HouseholdsModule,
    ExpensesModule,
    BalancesModule,
    BillsModule,
    ChoresModule,
    NotificationsModule,
    RemindersModule,
    AdminModule,
  ],
  providers: [
    // Sıra önemli: önce istek limiti, sonra kimlik doğrulama.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Tüm uçlar varsayılan olarak korumalıdır; @Public() ile muaf tutulur.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
