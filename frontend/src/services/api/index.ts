import { isMockMode } from '../../config';
import { mockApi } from '../mock/mockApi';
import { ApiClient } from './contracts';
import { httpApi } from './httpApi';

/**
 * Uygulamanın tek veri giriş noktası.
 * config/env.ts içindeki useMockApi bayrağı hangi uygulamanın kullanılacağını belirler.
 */
export const api: ApiClient = isMockMode() ? mockApi : httpApi;

export { httpApi, mockApi };
export { HttpError, httpClient } from './httpClient';
export type * from './contracts';
