import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKey } from './keys';

/**
 * AsyncStorage üzerine tip güvenli ince bir katman.
 * Hatalar uygulamayı düşürmemeli; okuma hatalarında null döner.
 */
export const storage = {
  async getItem(key: StorageKey): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: StorageKey, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // sessizce yut: kalıcılık kritik değil
    }
  },

  async getObject<T>(key: StorageKey): Promise<T | null> {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setObject<T>(key: StorageKey, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  },

  async removeItem(key: StorageKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // yoksay
    }
  },

  async multiRemove(keys: StorageKey[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys as string[]);
    } catch {
      // yoksay
    }
  },
};
