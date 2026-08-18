import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { NotificationType } from '../common/enums';
import { UpdatePreferencesDto, RegisterPushTokenDto } from './dto';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Notification } from './entities/notification.entity';
import { PushToken } from './entities/push-token.entity';
import { PushService } from './push.service';

export interface CreateNotificationParams {
  householdId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Bildirim gönderilecek kullanıcılar */
  userIds: string[];
  /** Eylemi yapan kişiye bildirim gitmemesi için */
  excludeUserId?: string;
  channelId?: string;
}

/** Tercih anahtarını bildirim türünden çıkarır */
const preferenceKeyFor = (
  type: NotificationType,
): keyof NotificationPreference => {
  switch (type) {
    case NotificationType.BILL_DUE:
    case NotificationType.BILL_OVERDUE:
    case NotificationType.BILL_PAID:
      return 'billReminders';
    case NotificationType.CHORE_ASSIGNED:
    case NotificationType.CHORE_DUE:
    case NotificationType.CHORE_COMPLETED:
      return 'choreReminders';
    case NotificationType.SETTLEMENT:
      return 'settlementAlerts';
    default:
      return 'expenseAlerts';
  }
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferences: Repository<NotificationPreference>,
    @InjectRepository(PushToken)
    private readonly pushTokens: Repository<PushToken>,
    private readonly push: PushService,
  ) {}

  // --- Tercihler ---

  async ensurePreferences(userId: string): Promise<NotificationPreference> {
    const existing = await this.preferences.findOne({ where: { userId } });
    if (existing) return existing;
    return this.preferences.save(this.preferences.create({ userId }));
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<NotificationPreference> {
    const preference = await this.ensurePreferences(userId);
    Object.assign(preference, dto);
    return this.preferences.save(preference);
  }

  // --- Push token kaydı ---

  async registerPushToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<void> {
    const existing = await this.pushTokens.findOne({
      where: { token: dto.token },
    });
    if (existing) {
      // Aynı cihaz başka bir hesaba geçmiş olabilir
      existing.userId = userId;
      existing.platform = dto.platform;
      existing.deviceName = dto.deviceName;
      await this.pushTokens.save(existing);
      return;
    }
    await this.pushTokens.save(this.pushTokens.create({ ...dto, userId }));
  }

  async removePushToken(token: string): Promise<void> {
    await this.pushTokens.delete({ token });
  }

  // --- Bildirim akışı ---

  list(householdId: string, userId: string): Promise<Notification[]> {
    return this.notifications.find({
      where: { householdId, userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async markRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notifications.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException('Bildirim bulunamadı.');
    notification.read = true;
    return this.notifications.save(notification);
  }

  async markAllRead(householdId: string, userId: string): Promise<void> {
    await this.notifications.update(
      { householdId, userId, read: false },
      { read: true },
    );
  }

  unreadCount(userId: string): Promise<number> {
    return this.notifications.countBy({ userId, read: false });
  }

  /**
   * Bildirimi veritabanına yazar ve tercihi açık olan kullanıcılara push gönderir.
   * Tercihler kapalıysa kayıt yine oluşturulur; kullanıcı uygulama içinde görebilir.
   */
  async dispatch(params: CreateNotificationParams): Promise<void> {
    const targets = params.userIds.filter((id) => id !== params.excludeUserId);
    if (targets.length === 0) return;

    const rows = targets.map((userId) =>
      this.notifications.create({
        householdId: params.householdId,
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data,
      }),
    );
    await this.notifications.save(rows);

    const preferenceKey = preferenceKeyFor(params.type);
    const preferences = await this.preferences.find({
      where: { userId: In(targets) },
    });

    const pushTargets = targets.filter((userId) => {
      const preference = preferences.find((p) => p.userId === userId);
      // Tercih kaydı yoksa varsayılan olarak açık kabul edilir
      if (!preference) return true;
      return preference.enabled && Boolean(preference[preferenceKey]);
    });
    if (pushTargets.length === 0) return;

    const tokens = await this.pushTokens.find({
      where: { userId: In(pushTargets) },
    });
    await this.push.send({
      tokens: tokens.map((row) => row.token),
      title: params.title,
      body: params.body,
      data: params.data,
      channelId: params.channelId,
    });
  }
}
