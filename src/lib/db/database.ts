import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

/**
 * Tijori's database is a SQLCipher-encrypted SQLite file in the app's private storage.
 * The 256-bit key is random per install and kept in SecureStore (Android Keystore),
 * so the file is unreadable even on a rooted phone or if copied off the device.
 */

const DB_NAME = 'tijori.db';
const KEY_NAME = 'tijori.db.key.v1';

async function getOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) return existing;

  const bytes = Crypto.getRandomBytes(32);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(KEY_NAME, hex);
  return hex;
}

const MIGRATIONS: string[] = [
  // v1
  `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dedup_key TEXT NOT NULL UNIQUE,
    amount_paise INTEGER NOT NULL,
    type TEXT NOT NULL,
    method TEXT NOT NULL,
    category TEXT NOT NULL,
    merchant TEXT NOT NULL,
    merchant_key TEXT NOT NULL,
    is_person INTEGER NOT NULL DEFAULT 0,
    bank TEXT,
    account_tail TEXT,
    reference TEXT,
    timestamp INTEGER NOT NULL,
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    body_hash TEXT NOT NULL,
    user_edited INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions (timestamp);
  CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions (merchant_key, type);
  CREATE INDEX IF NOT EXISTS idx_transactions_near_dup ON transactions (sender, body_hash);

  CREATE TABLE IF NOT EXISTS merchant_rules (
    rule_key TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
    });
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}

export async function openTijoriDatabase(): Promise<SQLite.SQLiteDatabase> {
  const key = await getOrCreateKey();
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  // Must be the first statement on the connection. A 64-hex-char x'' key is used as the
  // raw AES key, skipping SQLCipher's slow passphrase derivation.
  await db.execAsync(`PRAGMA key = "x'${key}'"`);
  await db.execAsync('PRAGMA journal_mode = WAL');
  await migrate(db);
  return db;
}
