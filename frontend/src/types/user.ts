import { ISODateString } from './common';

/**
 * Uygulama genelindeki yetki seviyesi.
 * Ev içi roller (owner/admin/member) bundan bağımsızdır — bkz. MemberRole.
 * İlk kayıt olan kullanıcı otomatik olarak 'admin' olur.
 */
export type PlatformRole = 'admin' | 'user';

/** Askıya alınan kullanıcı giriş yapamaz, verileri korunur */
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  platformRole: PlatformRole;
  status: UserStatus;
  createdAt: ISODateString;
  lastLoginAt?: ISODateString;
  emailVerifiedAt?: ISODateString | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountPayload {
  password: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}
