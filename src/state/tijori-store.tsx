import type { SQLiteDatabase } from 'expo-sqlite';
import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { Toast, type Notice } from '@/components/toast';
import type { CategoryId } from '@/lib/categories';
import { openTijoriDatabase } from '@/lib/db/database';
import { getMeta, ingestMessages, listTransactions, setCategory, setMeta } from '@/lib/db/repository';
import { formatMoney } from '@/lib/money';
import { addSmsListener, readInbox } from '@/lib/sms';
import type { Transaction } from '@/lib/types';

/** Re-read a little before the last scan so nothing slips through at the boundary. */
const RESCAN_OVERLAP_MS = 2 * 24 * 60 * 60 * 1000;
const NOTICE_MS = 2800;

type Status = 'loading' | 'ready' | 'error';
type ScanMode = 'auto' | 'manual';

type TijoriContextValue = {
  status: Status;
  error: string | null;
  transactions: Transaction[];
  scanning: boolean;
  /** `manual` always reports back (pull-to-refresh); `auto` stays quiet unless something new arrived. */
  scan: (mode?: ScanMode) => Promise<void>;
  updateCategory: (txn: Transaction, category: CategoryId, applyToMerchant: boolean) => Promise<void>;
};

const TijoriContext = createContext<TijoriContextValue | null>(null);

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function TijoriProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const dbRef = useRef<SQLiteDatabase | null>(null);
  const scanningRef = useRef(false);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const showNotice = useCallback((text: string, tone: Notice['tone'] = 'info') => {
    setNotice({ id: Date.now(), text, tone });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const scan = useCallback(
    async (mode: ScanMode = 'auto') => {
      const db = dbRef.current;
      if (!db || scanningRef.current) return;
      scanningRef.current = true;
      setScanning(true);
      try {
        const lastScan = Number((await getMeta(db, 'last_scan')) ?? 0);
        const startedAt = Date.now();
        const messages = await readInbox(lastScan > 0 ? lastScan - RESCAN_OVERLAP_MS : 0);
        const added = await ingestMessages(db, messages);
        await setMeta(db, 'last_scan', String(startedAt));

        if (added.length > 0) {
          setTransactions(await listTransactions(db));
          showNotice(`${added.length} new transaction${added.length === 1 ? '' : 's'} added`);
        } else if (mode === 'manual') {
          showNotice('You’re all caught up');
        }
      } catch (e) {
        showNotice(`Couldn’t read SMS — ${errorMessage(e)}`, 'error');
      } finally {
        scanningRef.current = false;
        setScanning(false);
      }
    },
    [showNotice],
  );

  // Open the encrypted database once SMS access is granted, then do the first scan.
  useEffect(() => {
    if (!enabled || dbRef.current) return;
    let cancelled = false;
    openTijoriDatabase()
      .then(async (db) => {
        const rows = await listTransactions(db);
        if (cancelled) return;
        dbRef.current = db;
        setTransactions(rows);
        setStatus('ready');
        await scan('auto');
      })
      .catch((e) => {
        if (cancelled) return;
        setError(errorMessage(e));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, scan]);

  // Catch up whenever the app returns to the foreground.
  useEffect(() => {
    if (status !== 'ready') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') scan('auto');
    });
    return () => subscription.remove();
  }, [status, scan]);

  // Pick up bank SMS the moment they arrive while the app is open.
  useEffect(() => {
    if (status !== 'ready') return;
    const subscription = addSmsListener(async (sms) => {
      const db = dbRef.current;
      if (!db) return;
      try {
        const added = await ingestMessages(db, [sms]);
        if (added.length === 0) return;
        setTransactions(await listTransactions(db));
        const txn = added[0];
        const verb = txn.type === 'credit' ? 'received from' : 'spent at';
        showNotice(`${formatMoney(txn.amountPaise)} ${verb} ${txn.merchant}`);
      } catch (e) {
        showNotice(errorMessage(e), 'error');
      }
    });
    return () => subscription.remove();
  }, [status, showNotice]);

  const updateCategory = useCallback(
    async (txn: Transaction, category: CategoryId, applyToMerchant: boolean) => {
      const db = dbRef.current;
      if (!db) return;
      await setCategory(db, txn, category, applyToMerchant);
      setTransactions(await listTransactions(db));
      showNotice(applyToMerchant && txn.merchantKey ? `Saved · all ${txn.merchant} updated` : 'Category saved');
    },
    [showNotice],
  );

  return (
    <TijoriContext value={{ status, error, transactions, scanning, scan, updateCategory }}>
      {children}
      <Toast notice={notice} />
    </TijoriContext>
  );
}

export function useTijori(): TijoriContextValue {
  const value = use(TijoriContext);
  if (!value) throw new Error('useTijori must be used inside TijoriProvider');
  return value;
}
