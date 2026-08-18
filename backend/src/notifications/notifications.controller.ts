import {
  Body,
  Controller,
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
import { RegisterPushTokenDto, UpdatePreferencesDto } from './dto';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser('id') userId: string,
    @Query('householdId', ParseUUIDPipe) householdId: string,
  ): Promise<Notification[]> {
    return this.notificationsService.list(householdId, userId);
  }

  @Get('preferences')
  getPreferences(
    @CurrentUser('id') userId: string,
  ): Promise<NotificationPreference> {
    return this.notificationsService.ensurePreferences(userId);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.updatePreferences(userId, dto);
  }

  @Post('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  registerPushToken(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterPushTokenDto,
  ): Promise<void> {
    return this.notificationsService.registerPushToken(userId, dto);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(
    @CurrentUser('id') userId: string,
    @Body('householdId', ParseUUIDPipe) householdId: string,
  ): Promise<void> {
    return this.notificationsService.markAllRead(householdId, userId);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.notificationsService.markRead(id, userId);
  }
}
