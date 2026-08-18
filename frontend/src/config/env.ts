import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  useMockApi?: boolean | string;
  easProjectId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const toBool = (value: boolean | string | undefined, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return fallback;
};

export const env = {
  /** NestJS backend adresi. app.json > extra.apiUrl üzerinden değiştirilebilir. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:3000/api',
  /**
   * true iken tüm istekler cihaz üzerindeki mock servise gider.
   * Backend hazır olduğunda app.json içinde false yapmak yeterlidir.
   */
  useMockApi: toBool(process.env.EXPO_PUBLIC_USE_MOCK_API ?? extra.useMockApi, true),
  /** Expo push token almak için gerekli */
  easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? extra.easProjectId,
  requestTimeoutMs: 15000,
} as const;

export const isMockMode = () => env.useMockApi;
