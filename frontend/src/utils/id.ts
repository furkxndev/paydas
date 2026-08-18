/**
 * Basit, çakışma ihtimali düşük id üretici.
 * Backend gerçek UUID üretecek; bu yalnızca yerel/mock kayıtlar içindir.
 */
export const createId = (prefix = ''): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${prefix ? '_' : ''}${time}${random}`;
};

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Karıştırılması kolay karakterleri (0/O, 1/I) içermeyen davet kodu */
export const createInviteCode = (length = 6): string =>
  Array.from({ length }, () =>
    INVITE_ALPHABET.charAt(Math.floor(Math.random() * INVITE_ALPHABET.length)),
  ).join('');
