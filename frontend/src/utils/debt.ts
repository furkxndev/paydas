import {
  CategoryBreakdownRow,
  Debt,
  Expense,
  HouseholdMember,
  MemberBalance,
  Settlement,
} from '../types';
import { round2 } from './money';

/** 1 kuruşun altındaki farkları sıfır kabul et */
const EPSILON = 0.005;

/**
 * Giderler ve yapılmış ödemelerden her üyenin net durumunu hesaplar.
 * net > 0  -> üye alacaklı (evin ona borcu var)
 * net < 0  -> üye borçlu
 */
export const calculateBalances = (
  members: HouseholdMember[],
  expenses: Expense[],
  settlements: Settlement[] = [],
): MemberBalance[] => {
  const balances = new Map<string, MemberBalance>();
  members.forEach((member) => {
    balances.set(member.userId, { userId: member.userId, paid: 0, owed: 0, net: 0 });
  });

  const ensure = (userId: string): MemberBalance => {
    let existing = balances.get(userId);
    if (!existing) {
      existing = { userId, paid: 0, owed: 0, net: 0 };
      balances.set(userId, existing);
    }
    return existing;
  };

  expenses.forEach((expense) => {
    ensure(expense.paidBy).paid += expense.amount;
    expense.shares.forEach((share) => {
      ensure(share.userId).owed += share.amount;
    });
  });

  // Yapılan ödeme, ödeyenin borcunu azaltır; alıcının alacağını azaltır
  settlements.forEach((settlement) => {
    ensure(settlement.fromUserId).paid += settlement.amount;
    ensure(settlement.toUserId).owed += settlement.amount;
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
 * "Herkes herkese ödeme yapsın" yerine "A -> C" gibi tek transfer üretir.
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
      debts.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amount });
    }

    debtor.amount = round2(debtor.amount - amount);
    creditor.amount = round2(creditor.amount - amount);

    if (debtor.amount <= EPSILON) debtorIndex += 1;
    if (creditor.amount <= EPSILON) creditorIndex += 1;
  }

  return debts;
};

/** Belirli bir kullanıcıyı ilgilendiren borçları ayırır */
export const splitDebtsForUser = (debts: Debt[], userId: string) => ({
  /** Kullanıcının ödemesi gerekenler */
  owes: debts.filter((d) => d.fromUserId === userId),
  /** Kullanıcının tahsil edeceği tutarlar */
  isOwed: debts.filter((d) => d.toUserId === userId),
});

export const getBalanceFor = (balances: MemberBalance[], userId: string): MemberBalance =>
  balances.find((b) => b.userId === userId) ?? { userId, paid: 0, owed: 0, net: 0 };

/** İki üye arasındaki net durumu döner (pozitifse other, user'a borçlu) */
export const netBetween = (
  expenses: Expense[],
  settlements: Settlement[],
  userId: string,
  otherId: string,
): number => {
  let net = 0;
  expenses.forEach((expense) => {
    if (expense.paidBy === userId) {
      net += expense.shares.find((s) => s.userId === otherId)?.amount ?? 0;
    }
    if (expense.paidBy === otherId) {
      net -= expense.shares.find((s) => s.userId === userId)?.amount ?? 0;
    }
  });
  settlements.forEach((settlement) => {
    if (settlement.fromUserId === otherId && settlement.toUserId === userId)
      net -= settlement.amount;
    if (settlement.fromUserId === userId && settlement.toUserId === otherId)
      net += settlement.amount;
  });
  return round2(net);
};

export const sumExpenses = (expenses: Expense[]): number =>
  round2(expenses.reduce((total, expense) => total + expense.amount, 0));

export const getCategoryBreakdown = (expenses: Expense[]): CategoryBreakdownRow[] => {
  const totals = new Map<string, number>();
  expenses.forEach((expense) => {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  });
  const grandTotal = sumExpenses(expenses);
  return Array.from(totals.entries())
    .map(([category, total]) => ({
      category,
      total: round2(total),
      ratio: grandTotal > 0 ? total / grandTotal : 0,
    }))
    .sort((a, b) => b.total - a.total);
};
