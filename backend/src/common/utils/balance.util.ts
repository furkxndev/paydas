import { round2 } from './money.util';

export interface MemberBalance {
  userId: string;
  /** Üyenin ev adına ödediği toplam */
  paid: number;
  /** Üyenin payına düşen toplam */
  owed: number;
  /** paid - owed. Pozitifse alacaklı, negatifse borçlu */
  net: number;
}

export interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface BalanceInputExpense {
  amount: number;
  paidBy: string;
  shares: { userId: string; amount: number }[];
}

export interface BalanceInputSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/** 1 kuruşun altındaki farkları sıfır kabul et */
const EPSILON = 0.005;

/**
 * Giderler ve yapılmış ödemelerden her üyenin net durumunu hesaplar.
 * Ödeme yapmak borcu azaltır (ödeyenin "paid" değerine eklenir).
 */
export const calculateBalances = (
  memberIds: string[],
  expenses: BalanceInputExpense[],
  settlements: BalanceInputSettlement[] = [],
): MemberBalance[] => {
  const balances = new Map<string, MemberBalance>();
  const ensure = (userId: string): MemberBalance => {
    let existing = balances.get(userId);
    if (!existing) {
      existing = { userId, paid: 0, owed: 0, net: 0 };
      balances.set(userId, existing);
    }
    return existing;
  };

  memberIds.forEach(ensure);

  expenses.forEach((expense) => {
    ensure(expense.paidBy).paid += Number(expense.amount);
    expense.shares.forEach((share) => {
      ensure(share.userId).owed += Number(share.amount);
    });
  });

  settlements.forEach((settlement) => {
    ensure(settlement.fromUserId).paid += Number(settlement.amount);
    ensure(settlement.toUserId).owed += Number(settlement.amount);
  });

  return Array.from(balances.values()).map((balance) => ({
    userId: balance.userId,
    paid: round2(balance.paid),
    owed: round2(balance.owed),
    net: round2(balance.paid - balance.owed),
  }));
};

/**
 * Net bakiyeleri en az sayıda transfere indirger (greedy min cash flow).
 * "Herkes herkese ödesin" yerine tek bir "A -> C" transferi üretir.
 */
export const simplifyDebts = (balances: MemberBalance[]): Debt[] => {
  const debtors = balances
    .filter((b) => b.net < -EPSILON)
    .map((b) => ({ userId: b.userId, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.net > EPSILON)
    .map((b) => ({ userId: b.userId, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const debts: Debt[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = round2(Math.min(debtor.amount, creditor.amount));

    if (amount > EPSILON) {
      debts.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount,
      });
    }

    debtor.amount = round2(debtor.amount - amount);
    creditor.amount = round2(creditor.amount - amount);

    if (debtor.amount <= EPSILON) debtorIndex += 1;
    if (creditor.amount <= EPSILON) creditorIndex += 1;
  }

  return debts;
};
