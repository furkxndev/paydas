import { ExpenseShare, SplitType } from '../types';
import { round2, splitEvenly } from './money';

/**
 * Seçilen bölüşme tipine göre üye paylarını hesaplar.
 * Dönen payların toplamı her zaman tutara eşittir (kuruş artıkları dağıtılır).
 */
export const buildShares = (
  amount: number,
  splitType: SplitType,
  participantIds: string[],
  weights: Record<string, number> = {},
): ExpenseShare[] => {
  if (participantIds.length === 0) return [];

  if (splitType === 'equal') {
    const parts = splitEvenly(amount, participantIds.length);
    return participantIds.map((userId, index) => ({ userId, amount: parts[index] }));
  }

  if (splitType === 'exact') {
    return participantIds.map((userId) => ({
      userId,
      amount: round2(weights[userId] ?? 0),
      weight: weights[userId] ?? 0,
    }));
  }

  // percentage ve shares aynı mantıkla oransal dağıtılır
  const totalWeight = participantIds.reduce((sum, id) => sum + (weights[id] ?? 0), 0);
  if (totalWeight <= 0) {
    const parts = splitEvenly(amount, participantIds.length);
    return participantIds.map((userId, index) => ({ userId, amount: parts[index], weight: 0 }));
  }

  const cents = Math.round(round2(amount) * 100);
  let distributed = 0;
  const shares: ExpenseShare[] = participantIds.map((userId, index) => {
    const weight = weights[userId] ?? 0;
    const isLast = index === participantIds.length - 1;
    const portion = isLast ? cents - distributed : Math.round((cents * weight) / totalWeight);
    distributed += portion;
    return { userId, amount: round2(portion / 100), weight };
  });

  return shares;
};

export const sumShares = (shares: ExpenseShare[]): number =>
  round2(shares.reduce((total, share) => total + share.amount, 0));

/** exact modunda girilen payların tutarı karşılayıp karşılamadığını kontrol eder */
export const getShareDifference = (amount: number, shares: ExpenseShare[]): number =>
  round2(round2(amount) - sumShares(shares));
