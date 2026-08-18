import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { useHouseholdData } from '../hooks/useHouseholdData';
import { api, notificationService, storage, StorageKeys } from '../services';
import { NotificationPreferences } from '../types';

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  billReminders: true,
  expenseAlerts: true,
  choreReminders: true,
  settlementAlerts: true,
  reminderHour: 10,
};

export interface NotificationContextValue {
  preferences: NotificationPreferences;
  permissionGranted: boolean;
  pushToken: string | null;
  /** Planlanmış yerel hatırlatma sayısı */
  scheduledCount: number;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
  updatePreferences: (payload: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  syncReminders: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const { currency } = useHousehold();
  const { bills, chores } = useHouseholdData();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Tercihleri ve izin durumunu yükle
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!isAuthenticated) {
        if (active) setLoading(false);
        return;
      }
      try {
        const [remote, granted, cachedToken] = await Promise.all([
          api.notifications.getPreferences(),
          notificationService.getPermissionStatus(),
          storage.getItem(StorageKeys.pushToken),
        ]);
        if (!active) return;
        setPreferences(remote);
        setPermissionGranted(granted);
        setPushToken(cachedToken);
      } catch {
        if (active) setPreferences(defaultPreferences);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const registerPushToken = useCallback(async () => {
    const token = await notificationService.getPushToken();
    if (!token) return;
    setPushToken(token);
    await storage.setItem(StorageKeys.pushToken, token);
    try {
      await api.notifications.registerPushToken({
        token,
        platform: notificationService.getPlatform(),
      });
    } catch {
      // token kaydı başarısız olsa da yerel bildirimler çalışmaya devam eder
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermissions();
    setPermissionGranted(granted);
    if (granted) await registerPushToken();
    return granted;
  }, [registerPushToken]);

  const syncReminders = useCallback(async () => {
    if (!user || !permissionGranted) return;
    const count = await notificationService.syncReminders({
      bills,
      chores,
      currency,
      currentUserId: user.id,
      preferences,
    });
    setScheduledCount(count);
  }, [bills, chores, currency, permissionGranted, preferences, user]);

  // Fatura/görev/tercih değişimlerinde yerel hatırlatmaları yeniden kur.
  useEffect(() => {
    syncReminders();
  }, [syncReminders]);

  const updatePreferences = useCallback(
    async (payload: Partial<NotificationPreferences>) => {
      const optimistic = { ...preferences, ...payload };
      setPreferences(optimistic);
      if (payload.enabled && !permissionGranted) {
        await requestPermission();
      }
      try {
        const saved = await api.notifications.updatePreferences(payload);
        setPreferences(saved);
      } catch {
        setPreferences(preferences);
      }
    },
    [permissionGranted, preferences, requestPermission],
  );

  const sendTestNotification = useCallback(async () => {
    const granted = permissionGranted || (await requestPermission());
    if (!granted) return;
    await notificationService.sendTestNotification();
  }, [permissionGranted, requestPermission]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      preferences,
      permissionGranted,
      pushToken,
      scheduledCount,
      loading,
      requestPermission,
      updatePreferences,
      sendTestNotification,
      syncReminders,
    }),
    [
      preferences,
      permissionGranted,
      pushToken,
      scheduledCount,
      loading,
      requestPermission,
      updatePreferences,
      sendTestNotification,
      syncReminders,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
