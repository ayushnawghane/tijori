import type { CategoryId } from './categories';

export type TxnType = 'debit' | 'credit';

export type PaymentMethod = 'upi' | 'card' | 'bank_transfer' | 'atm' | 'wallet' | 'other';

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  atm: 'ATM',
  wallet: 'Wallet',
  other: 'Bank',
};

export interface RawSms {
  sender: string;
  body: string;
  timestamp: number;
}

/** What the parser can tell from a single SMS, before categorisation. */
export interface ParsedTransaction {
  amountPaise: number;
  type: TxnType;
  method: PaymentMethod;
  merchant: string;
  /** Stable identity for "always categorise this merchant as…" rules. Empty when unknown. */
  merchantKey: string;
  /** True when the counterparty looks like an individual (P2P UPI), not a business. */
  isPerson: boolean;
  bank: string | null;
  accountTail: string | null;
  reference: string | null;
  timestamp: number;
  sender: string;
  body: string;
  bodyHash: string;
  dedupKey: string;
}

export interface Transaction extends ParsedTransaction {
  id: number;
  category: CategoryId;
  userEdited: boolean;
}
