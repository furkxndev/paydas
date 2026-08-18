import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api, storage, StorageKeys } from '../services';
import {
  AuthSession,
  ChangePasswordPayload,
  DeleteAccountPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '../types';

export interface AuthContextValue {
  user: User | null;
  /** Uygulama açılışında oturum geri yükleniyor mu */
  initializing: boolean;
  submitting: boolean;
  error: string | null;
  isAuthenticated: boolean;
  /** Platform yöneticisi mi (ev içi rollerden bağımsız) */
  isPlatformAdmin: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  /** Hesabı kalıcı olarak siler ve oturumu kapatır */
  deleteAccount: (payload: DeleteAccountPayload) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistSession = async (session: AuthSession) => {
  await Promise.all([
    storage.setItem(StorageKeys.accessToken, session.tokens.accessToken),
    storage.setItem(StorageKeys.refreshToken, session.tokens.refreshToken),
    storage.setObject(StorageKeys.currentUser, session.user),
  ]);
};

const clearSession = async () => {
  await storage.multiRemove([
    StorageKeys.accessToken,
    StorageKeys.refreshToken,
    StorageKeys.currentUser,
    StorageKeys.activeHouseholdId,
  ]);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      const token = await storage.getItem(StorageKeys.accessToken);
      const cached = await storage.getObject<User>(StorageKeys.currentUser);
      if (!token || !cached) {
        if (active) setInitializing(false);
        return;
      }
      // Önce önbellekten göster, ardından sunucudan doğrula
      if (active) setUser(cached);
      try {
        const fresh = await api.auth.me();
        if (active) {
          setUser(fresh);
          await storage.setObject(StorageKeys.currentUser, fresh);
        }
      } catch {
        await clearSession();
        if (active) setUser(null);
      } finally {
        if (active) setInitializing(false);
      }
    };

    restore();
    return () => {
      active = false;
    };
  }, []);

  const runAuth = useCallback(async (action: () => Promise<AuthSession>) => {
    setSubmitting(true);
    setError(null);
    try {
      const session = await action();
      await persistSession(session);
      setUser(session.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const login = useCallback(
    (payload: LoginPayload) => runAuth(() => api.auth.login(payload)),
    [runAuth],
  );

  const register = useCallback(
    (payload: RegisterPayload) => runAuth(() => api.auth.register(payload)),
    [runAuth],
  );

  const logout = useCallback(async () => {
    try {
      // Refresh token sunucuda iptal edilir; aksi halde çalınan token geçerli kalırdı
      const refreshToken = await storage.getItem(StorageKeys.refreshToken);
      await api.auth.logout(refreshToken ?? undefined);
    } catch {
      // sunucuya ulaşılamasa da yerel oturum kapatılır
    }
    await clearSession();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (payload: ForgotPasswordPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.forgotPassword(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İstek gönderilemedi');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.changePassword(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre değiştirilemedi');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteAccount = useCallback(async (payload: DeleteAccountPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.deleteAccount(payload);
      await clearSession();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesap silinemedi');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.auth.updateProfile(payload);
      setUser(updated);
      await storage.setObject(StorageKeys.currentUser, updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil güncellenemedi');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      submitting,
      error,
      isAuthenticated: Boolean(user),
      isPlatformAdmin: user?.platformRole === 'admin',
      login,
      register,
      logout,
      updateProfile,
      forgotPassword,
      changePassword,
      deleteAccount,
      clearError: () => setError(null),
    }),
    [
      user,
      initializing,
      submitting,
      error,
      login,
      register,
      logout,
      updateProfile,
      forgotPassword,
      changePassword,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
