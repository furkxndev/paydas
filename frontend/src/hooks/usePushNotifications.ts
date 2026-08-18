import { useContext } from 'react';
import {
  NotificationContext,
  type NotificationContextValue,
} from '../context/NotificationContext';

/** Bildirim izinleri, tercihleri ve yerel hatırlatma yönetimi */
export const usePushNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('usePushNotifications, NotificationProvider içinde kullanılmalıdır.');
  }
  return context;
};
