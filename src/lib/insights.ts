import { getCategory, type CategoryId } from './categories';
import { METHOD_LABEL, type Transaction } from './types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface MonthRef {
  year: number;
  /** 0 = January */
  month: number;
}

export function currentMonth(now = new Date()): MonthRef {
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function shiftMonth(ref: MonthRef, delta: number): MonthRef {
  const d = new Date(ref.year, ref.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function isSameMonth(a: MonthRef, b: MonthRef): boolean {
  return a.year === b.year && a.month === b.month;
}

export function monthLabel(ref: MonthRef): string {
  return `${MONTHS[ref.month]} ${ref.year}`;
}

export interface CategorySlice {
  category: CategoryId;
  amountPaise: number;
  /** 0–1 share of the month's spending. */
  share: number;
  count: number;
}

export interface MonthSummary {
  incomePaise: number;
  spendPaise: number;
  netPaise: number;
  count: number;
  slices: CategorySlice[];
  transactions: Transaction[];
}

export function summarizeMonth(all: Transaction[], ref: MonthRef): MonthSummary {
  const start = new Date(ref.year, ref.month, 1).getTime();
  const end = new Date(ref.year, ref.month + 1, 1).getTime();
  const transactions = all.filter((t) => t.timestamp >= start && t.timestamp < end);

  let incomePaise = 0;
  let spendPaise = 0;
  const byCategory = new Map<CategoryId, { amount: number; count: number }>();

  for (const t of transactions) {
    if (t.type === 'credit') {
      incomePaise += t.amountPaise;
      continue;
    }
    spendPaise += t.amountPaise;
    const entry = byCategory.get(t.category) ?? { amount: 0, count: 0 };
    entry.amount += t.amountPaise;
    entry.count += 1;
    byCategory.set(t.category, entry);
  }

  const slices = [...byCategory.entries()]
    .map(([category, { amount, count }]) => ({
      category,
      amountPaise: amount,
      count,
      share: spendPaise ? amount / spendPaise : 0,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise);

  return { incomePaise, spendPaise, netPaise: incomePaise - spendPaise, count: transactions.length, slices, transactions };
}

export interface DaySection {
  key: string;
  title: string;
  spendPaise: number;
  data: Transaction[];
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Expects transactions sorted newest first (as stored). */
export function groupByDay(transactions: Transaction[], now = new Date()): DaySection[] {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const sections: DaySection[] = [];
  let current: DaySection | null = null;

  for (const t of transactions) {
    const d = new Date(t.timestamp);
    const key = dayKey(d);
    if (!current || current.key !== key) {
      const sameYear = d.getFullYear() === now.getFullYear();
      const title: string =
        key === today
          ? 'Today'
          : key === yesterday
            ? 'Yesterday'
            : `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}${sameYear ? '' : ` ${d.getFullYear()}`}`;
      current = { key, title, spendPaise: 0, data: [] };
      sections.push(current);
    }
    current.data.push(t);
    if (t.type === 'debit') current.spendPaise += t.amountPaise;
  }
  return sections;
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'am' : 'pm'}`;
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()} · ${formatTime(timestamp)}`;
}

export type TxnFilter = 'all' | 'spent' | 'received';

export function filterTransactions(transactions: Transaction[], query: string, filter: TxnFilter): Transaction[] {
  const q = query.trim().toLowerCase();
  return transactions.filter((t) => {
    if (filter === 'spent' && t.type !== 'debit') return false;
    if (filter === 'received' && t.type !== 'credit') return false;
    if (!q) return true;
    const haystack = `${t.merchant} ${getCategory(t.category).label} ${t.bank ?? ''} ${METHOD_LABEL[t.method]} ${Math.round(t.amountPaise / 100)}`.toLowerCase();
    return haystack.includes(q);
  });
}
