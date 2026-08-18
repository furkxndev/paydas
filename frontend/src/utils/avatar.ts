import { avatarColors } from '../theme';

/** Aynı kullanıcı her zaman aynı rengi alsın diye id'den deterministik seçim */
export const getAvatarColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return avatarColors[hash % avatarColors.length];
};

export const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr-TR');
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr-TR');
};

/** "Ahmet Yılmaz" -> "Ahmet" */
export const getFirstName = (fullName: string): string =>
  fullName.trim().split(/\s+/)[0] ?? fullName;
