const PREFIX = '@paydas';

export const StorageKeys = {
  accessToken: `${PREFIX}/auth/accessToken`,
  refreshToken: `${PREFIX}/auth/refreshToken`,
  currentUser: `${PREFIX}/auth/currentUser`,
  activeHouseholdId: `${PREFIX}/household/activeId`,
  notificationPreferences: `${PREFIX}/notifications/preferences`,
  pushToken: `${PREFIX}/notifications/pushToken`,
  onboardingSeen: `${PREFIX}/app/onboardingSeen`,
  mockDatabase: `${PREFIX}/mock/db`,
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
