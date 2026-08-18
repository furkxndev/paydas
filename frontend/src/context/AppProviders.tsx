import React, { type ReactNode } from 'react';

import { AuthProvider } from './AuthContext';
import { HouseholdProvider } from './HouseholdContext';
import { HouseholdDataProvider } from './HouseholdDataContext';
import { NotificationProvider } from './NotificationContext';
import { ToastProvider } from './ToastContext';

/**
 * Sağlayıcı sırası önemlidir:
 * Auth -> Household -> HouseholdData -> Notification
 * Her katman bir üstündekinin verisine bağımlıdır.
 */
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <AuthProvider>
      <HouseholdProvider>
        <HouseholdDataProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </HouseholdDataProvider>
      </HouseholdProvider>
    </AuthProvider>
  </ToastProvider>
);
