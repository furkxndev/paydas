/** Kuruş hatalarını engellemek için 2 basamağa yuvarlar */
export const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Bir tutarı n kişiye böler ve kuruş artıklarını ilk kişilere dağıtır.
 * Dönen değerlerin toplamı her zaman girilen tutara eşittir.
 */
export const splitEvenly = (amount: number, count: number): number[] => {
  if (count <= 0) return [];
  const cents = Math.round(round2(amount) * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return Array.from({ length: count }, (_, index) =>
    round2((base + (index < remainder ? 1 : 0)) / 100),
  );
};

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Karıştırılması kolay karakterleri (0/O, 1/I) içermeyen davet kodu */
export const createInviteCode = (length = 6): string =>
  Array.from({ length }, () =>
    INVITE_ALPHABET.charAt(Math.floor(Math.random() * INVITE_ALPHABET.length)),
  ).join('');
