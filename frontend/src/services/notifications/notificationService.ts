import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { env } from '../../config';
import { getBillTypeMeta } from '../../constants';
import { Bill, Chore, NotificationPreferences } from '../../types';
import { addDays, formatCurrency, startOfDay } from '../../utils';

/** Bildirim geldiğinde uygulama ön plandaysa da gösterilsin */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ANDROID_CHANNELS = [
  { id: 'bills', name: 'Fatura hatırlatmaları', description: 'Yaklaşan ve geciken faturalar' },
  { id: 'chores', name: 'Ev işleri', description: 'Görev atamaları ve hatırlatmalar' },
  { id: 'expenses', name: 'Harcamalar', description: 'Yeni gider ve ödeme bildirimleri' },
] as const;

type ChannelId = (typeof ANDROID_CHANNELS)[number]['id'];

const ensureAndroidChannels = async () => {
  if (Platform.OS !== 'android') return;
  await Promise.all(
    ANDROID_CHANNELS.map((channel) =>
      Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5B5BD6',
      }),
    ),
  );
};

/** Bildirim tarihi geçmişse planlama yapılmaz */
const scheduleAt = async (
  date: Date,
  content: { title: string; body: string; data?: Record<string, unknown> },
  channelId: ChannelId,
): Promise<string | null> => {
  if (date.getTime() <= Date.now()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data,
        sound: true,
        ...(Platform.OS === 'android' ? { channelId } : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {
    return null;
  }
};

const atHour = (date: string | number | Date, hour: number): Date => {
  const result = startOfDay(date);
  result.setHours(hour, 0, 0, 0);
  return result;
};

export const notificationService = {
  /**
   * İzin ister ve Expo push token'ı döner.
   * Expo Go (Android) üzerinde uzak bildirim desteklenmediği için token null olabilir;
   * yerel hatırlatmalar yine de çalışır.
   */
  async requestPermissions(): Promise<boolean> {
    await ensureAndroidChannels();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return requested.granted;
  },

  async getPermissionStatus(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    return current.granted;
  },

  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;
    if (!env.easProjectId) return null;
    try {
      const token = await Notifications.getExpoPushTokenAsync({ projectId: env.easProjectId });
      return token.data;
    } catch {
      return null;
    }
  },

  getPlatform(): 'ios' | 'android' | 'web' {
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'web';
  },

  /** Faturanın son ödeme tarihine göre hatırlatma ve gecikme bildirimi planlar */
  async scheduleBillReminders(
    bill: Bill,
    currency: string,
    preferences: NotificationPreferences,
  ): Promise<string[]> {
    if (!preferences.enabled || !preferences.billReminders) return [];
    if (bill.status === 'paid') return [];

    const meta = getBillTypeMeta(bill.type);
    const amount = formatCurrency(bill.amount, currency);
    const ids: string[] = [];

    const reminderDate = atHour(
      addDays(bill.dueDate, -bill.reminderDaysBefore),
      preferences.reminderHour,
    );
    const reminderId = await scheduleAt(
      reminderDate,
      {
        title: `${meta.label} faturası yaklaşıyor`,
        body: `${bill.reminderDaysBefore} gün içinde ödenmeli • ${amount}`,
        data: { type: 'bill_due', billId: bill.id },
      },
      'bills',
    );
    if (reminderId) ids.push(reminderId);

    const dueDayId = await scheduleAt(
      atHour(bill.dueDate, preferences.reminderHour),
      {
        title: `${meta.label} faturası bugün son gün`,
        body: `${bill.name} • ${amount}`,
        data: { type: 'bill_due', billId: bill.id },
      },
      'bills',
    );
    if (dueDayId) ids.push(dueDayId);

    const overdueId = await scheduleAt(
      atHour(addDays(bill.dueDate, 1), preferences.reminderHour),
      {
        title: `${meta.label} faturası gecikti`,
        body: `${bill.name} • ${amount} hâlâ ödenmedi.`,
        data: { type: 'bill_overdue', billId: bill.id },
      },
      'bills',
    );
    if (overdueId) ids.push(overdueId);

    return ids;
  },

  /** Görevin son tarihinden birkaç saat önce hatırlatır */
  async scheduleChoreReminder(
    chore: Chore,
    preferences: NotificationPreferences,
  ): Promise<string | null> {
    if (!preferences.enabled || !preferences.choreReminders) return null;
    if (chore.status === 'done' || !chore.dueDate) return null;

    const dueDate = new Date(chore.dueDate);
    const remindAt = new Date(dueDate.getTime() - 3 * 60 * 60 * 1000);

    return scheduleAt(
      remindAt,
      {
        title: 'Ev işi hatırlatması',
        body: `${chore.title} görevinin zamanı yaklaşıyor.`,
        data: { type: 'chore_due', choreId: chore.id },
      },
      'chores',
    );
  },

  /**
   * Tüm yerel hatırlatmaları güncel veriye göre yeniden kurar.
   * Fatura/görev değişimlerinde çağrılır; eski planlar önce temizlenir.
   */
  async syncReminders(params: {
    bills: Bill[];
    chores: Chore[];
    currency: string;
    currentUserId: string;
    preferences: NotificationPreferences;
  }): Promise<number> {
    const { bills, chores, currency, currentUserId, preferences } = params;
    await this.cancelAll();
    if (!preferences.enabled) return 0;

    let scheduled = 0;

    for (const bill of bills.filter((b) => b.status !== 'paid')) {
      const ids = await this.scheduleBillReminders(bill, currency, preferences);
      scheduled += ids.length;
    }

    for (const chore of chores.filter(
      (c) =>
        c.status === 'pending' && (c.assignedTo === currentUserId || c.assignedTo === null),
    )) {
      const id = await this.scheduleChoreReminder(chore, preferences);
      if (id) scheduled += 1;
    }

    return scheduled;
  },

  /** Test amaçlı anlık bildirim (Ayarlar ekranından tetiklenir) */
  async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Paydaş bildirimleri açık',
        body: 'Fatura, ödeme ve ev işi hatırlatmaları bu şekilde görünecek.',
        data: { type: 'test' },
        ...(Platform.OS === 'android' ? { channelId: 'bills' } : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
    });
  },

  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // planlanmış bildirim yoksa sorun değil
    }
  },

  async getScheduledCount(): Promise<number> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.length;
    } catch {
      return 0;
    }
  },

  /** Bildirime dokunulduğunda yönlendirme için dinleyici kurar */
  addResponseListener(handler: (data: Record<string, unknown>) => void) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      handler((response.notification.request.content.data ?? {}) as Record<string, unknown>);
    });
  },

  addReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  },
};
