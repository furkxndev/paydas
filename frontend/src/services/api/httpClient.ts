import { env } from '../../config';
import { ApiError } from '../../types';
import { storage, StorageKeys } from '../storage';

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** Authorization başlığı eklenmesin (login/register için) */
  skipAuth?: boolean;
  signal?: AbortSignal;
}

export class HttpError extends Error implements ApiError {
  status: number;
  code?: string;
  details?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'HttpError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

const buildUrl = (path: string, query?: Query): string => {
  const base = env.apiUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return params.length > 0 ? `${url}?${params.join('&')}` : url;
};

const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const toHttpError = (status: number, payload: unknown): HttpError => {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const message = Array.isArray(record.message)
      ? (record.message as string[]).join('\n')
      : ((record.message as string) ?? 'Beklenmeyen bir hata oluştu');
    return new HttpError({
      status,
      message,
      code: record.error as string | undefined,
      details: record.details as Record<string, string[]> | undefined,
    });
  }
  return new HttpError({ status, message: 'Beklenmeyen bir hata oluştu' });
};

/**
 * NestJS backend'i ile konuşan fetch tabanlı istemci.
 * Token yönetimi ve hata normalizasyonu tek yerde toplanır.
 */
export const httpClient = {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, skipAuth = false, signal } = options;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!skipAuth) {
      const token = await storage.getItem(StorageKeys.accessToken);
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs);
    if (signal) signal.addEventListener('abort', () => controller.abort());

    try {
      const response = await fetch(buildUrl(path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = await parseBody(response);
      if (!response.ok) throw toHttpError(response.status, payload);
      return payload as T;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new HttpError({ status: 408, message: 'İstek zaman aşımına uğradı' });
      }
      throw new HttpError({
        status: 0,
        message: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.',
      });
    } finally {
      clearTimeout(timeout);
    }
  },

  get<T>(path: string, query?: Query) {
    return this.request<T>(path, { method: 'GET', query });
  },
  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body });
  },
  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  },
};
