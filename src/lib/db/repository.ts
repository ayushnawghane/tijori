import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryId } from '../categories';
import { categorize, ruleKey } from '../parser/categorizer';
import { parseSms } from '../parser/sms-parser';
import type { PaymentMethod, RawSms, Transaction, TxnType } from '../types';

/** The same SMS seen by the live listener and later by an inbox scan lands within seconds. */
const NEAR_DUPLICATE_MS = 5 * 60 * 1000;

type TransactionRow = {
  id: number;
  dedup_key: string;
  amount_paise: number;
  type: string;
  method: string;
  category: string;
  merchant: string;
  merchant_key: string;
  is_person: number;
  bank: string | null;
  account_tail: string | null;
  reference: string | null;
  timestamp: number;
  sender: string;
  body: string;
  body_hash: string;
  user_edited: number;
};

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    dedupKey: row.dedup_key,
    amountPaise: row.amount_paise,
    type: row.type as TxnType,
    method: row.method as PaymentMethod,
    category: row.category as CategoryId,
    merchant: row.merchant,
    merchantKey: row.merchant_key,
    isPerson: row.is_person === 1,
    bank: row.bank,
    accountTail: row.account_tail,
    reference: row.reference,
    timestamp: row.timestamp,
    sender: row.sender,
    body: row.body,
    bodyHash: row.body_hash,
    userEdited: row.user_edited === 1,
  };
}

export async function listTransactions(db: SQLiteDatabase): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY timestamp DESC, id DESC');
  return rows.map(toTransaction);
}

/** Parses, categorises and stores messages. Returns the transactions that were new. */
export async function ingestMessages(db: SQLiteDatabase, messages: RawSms[]): Promise<Transaction[]> {
  if (messages.length === 0) return [];
  const added: Transaction[] = [];

  await db.withExclusiveTransactionAsync(async (tx) => {
    const ruleRows = await tx.getAllAsync<{ rule_key: string; category: string }>(
      'SELECT rule_key, category FROM merchant_rules',
    );
    const rules = new Map(ruleRows.map((r) => [r.rule_key, r.category as CategoryId]));

    for (const sms of messages) {
      const parsed = parseSms(sms);
      if (!parsed) continue;

      if (!parsed.reference) {
        const near = await tx.getFirstAsync<{ n: number }>(
          'SELECT COUNT(*) AS n FROM transactions WHERE sender = ? AND body_hash = ? AND timestamp BETWEEN ? AND ?',
          [parsed.sender, parsed.bodyHash, parsed.timestamp - NEAR_DUPLICATE_MS, parsed.timestamp + NEAR_DUPLICATE_MS],
        );
        if (near && near.n > 0) continue;
      }

      const category = categorize(parsed, rules);
      const result = await tx.runAsync(
        `INSERT OR IGNORE INTO transactions
          (dedup_key, amount_paise, type, method, category, merchant, merchant_key, is_person,
           bank, account_tail, reference, timestamp, sender, body, body_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parsed.dedupKey,
          parsed.amountPaise,
          parsed.type,
          parsed.method,
          category,
          parsed.merchant,
          parsed.merchantKey,
          parsed.isPerson ? 1 : 0,
          parsed.bank,
          parsed.accountTail,
          parsed.reference,
          parsed.timestamp,
          parsed.sender,
          parsed.body,
          parsed.bodyHash,
        ],
      );
      if (result.changes > 0) {
        added.push({ ...parsed, id: result.lastInsertRowId, category, userEdited: false });
      }
    }
  });

  return added;
}

/**
 * Changes one transaction's category. With `applyToMerchant`, also remembers the choice
 * for this merchant (same direction only, so a Swiggy refund isn't filed as food) and
 * re-files every past transaction from them.
 */
export async function setCategory(
  db: SQLiteDatabase,
  txn: Transaction,
  category: CategoryId,
  applyToMerchant: boolean,
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    if (applyToMerchant && txn.merchantKey) {
      await tx.runAsync(
        `INSERT INTO merchant_rules (rule_key, category) VALUES (?, ?)
         ON CONFLICT(rule_key) DO UPDATE SET category = excluded.category`,
        [ruleKey(txn.type, txn.merchantKey), category],
      );
      await tx.runAsync('UPDATE transactions SET category = ? WHERE merchant_key = ? AND type = ?', [
        category,
        txn.merchantKey,
        txn.type,
      ]);
    }
    await tx.runAsync('UPDATE transactions SET category = ?, user_edited = 1 WHERE id = ?', [category, txn.id]);
  });
}

export async function getMeta(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setMeta(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}
