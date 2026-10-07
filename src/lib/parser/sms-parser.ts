import { fnv1a } from '../hash';
import { toPaise } from '../money';
import type { ParsedTransaction, PaymentMethod, RawSms, TxnType } from '../types';
import { bankName, senderHeader } from './bank-directory';
import { fallbackMerchant, merchantFromText, merchantFromVpa, type Merchant } from './merchant';

/**
 * Turns a bank/card SMS into a ParsedTransaction, or null when the message isn't a
 * completed money movement (OTPs, reminders, offers, failed payments…).
 *
 * Indian bank SMS are templated, so plain regexes go a long way. No network, no AI.
 */

const AMOUNT = /(^|[^a-z])(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;

const DEBIT = /\b(?:debited|debit(?!\s*card)|spent|paid|sent|withdrawn|withdrawal|purchased?|deducted)\b/i;
const CREDIT = /\b(?:credited|credit(?!\s*card)|received|deposited|refunded|refund|cashback|reversed)\b/i;

const NOISE = new RegExp(
  [
    String.raw`\botp\b`,
    String.raw`one[\s-]?time\s?password`,
    String.raw`verification code`,
    String.raw`\bcode is\b`,
    String.raw`\bis due\b`,
    String.raw`\bdue (?:on|by|date)\b`,
    String.raw`(?:amount|amt) due`,
    String.raw`statement (?:is|for|has been|generated)`,
    String.raw`will be (?:debited|credited|deducted)`,
    String.raw`to be debited`,
    String.raw`\bscheduled\b`,
    String.raw`has requested`,
    String.raw`requested (?:money|rs|inr|₹)`,
    String.raw`collect request`,
    String.raw`pre[\s-]?approved`,
    String.raw`loan offer`,
    String.raw`\beligible\b`,
    String.raw`\bfailed\b`,
    String.raw`\bdeclined\b`,
    String.raw`unsuccessful`,
    String.raw`could not be`,
    String.raw`\brejected\b`,
    String.raw`received towards your`,
    String.raw`thank you for (?:your |the )?payment`,
  ].join('|'),
  'i',
);

const ACCOUNT =
  /\b(?:a\/c|ac|acct|account|card)\b[^0-9]{0,20}?(?:[x*]+|ending\s*(?:with\s*)?|no\.?\s*[x*]*)\s*(\d{3,6})\b/i;

const VPA = /([a-z0-9][a-z0-9.\-_]{1,63})@([a-z][a-z0-9]{1,30})\b(?!\.[a-z])/i;

const REFERENCE =
  /\b(?:upi\s*ref(?:erence)?|ref(?:erence)?|rrn|utr|txn\s*id|transaction\s*id|upi)(?:\s*(?:no|number|id)\b)?[\s.:#-]*((?=[a-z0-9]*\d)[a-z0-9]{6,22})\b/i;

const NAME = String.raw`([a-z0-9][a-z0-9 &'*_\-/]{1,40}?)`;
const STOP = String.raw`(?=\s+(?:on|for|via|ref|upi|txn|avl|bal|info|dated|thru|through|using|from|to|with|is|has|and)\b|\s*[.,;:(]|\s*$)`;
const AT = new RegExp(String.raw`\bat\s+` + NAME + STOP, 'gi');
/** ICICI-style "spent … on 04-Oct-26 on AMAZON PAY IN" — dates are filtered in looksLikeName. */
const ON = new RegExp(String.raw`\bon\s+` + NAME + STOP, 'gi');
const TO = new RegExp(String.raw`\b(?:to|towards)\s+` + NAME + STOP, 'gi');
const FROM = new RegExp(String.raw`\b(?:from|by)\s+` + NAME + STOP, 'gi');
const INFO = new RegExp(String.raw`\binfo[:\s]+` + NAME + STOP, 'gi');

const NOT_A_NAME = /^(?:a\/c|ac|acct|account|your|you|card|vpa|beneficiary|the|a|an|self|bank|mobile|ending|net ?banking|date)\b/i;
const DATE_LIKE = /^(?:\d|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b)/i;

/** Two SMS for one payment (e.g. bank + card) are merged if they share a reference. */
export function dedupKeyFor(p: Pick<ParsedTransaction, 'reference' | 'type' | 'sender' | 'bodyHash' | 'timestamp'>): string {
  return p.reference ? `ref:${p.type}:${p.reference}` : `sms:${p.sender}:${p.bodyHash}:${p.timestamp}`;
}

export function parseSms(sms: RawSms): ParsedTransaction | null {
  const header = senderHeader(sms.sender);
  if (!header) return null;

  const body = sms.body.replace(/\s+/g, ' ').trim();
  if (!body || NOISE.test(body)) return null;

  const type = detectType(body);
  if (!type) return null;

  const amountPaise = findAmount(body);
  if (!amountPaise) return null;

  const bank = bankName(header);
  const accountTail = ACCOUNT.exec(body)?.[1] ?? null;
  // Unknown senders must at least mention a masked account/card, which filters out
  // shops and apps that send "payment received" style receipts.
  if (!bank && !accountTail) return null;

  const method = detectMethod(body);
  const merchant =
    (method === 'atm' ? null : findMerchant(body, type)) ?? fallbackMerchant(type, method);
  const reference = REFERENCE.exec(body)?.[1]?.toUpperCase() ?? null;
  const bodyHash = fnv1a(body);

  const parsed = {
    amountPaise,
    type,
    method,
    merchant: merchant.display,
    merchantKey: merchant.key,
    isPerson: merchant.isPerson,
    bank,
    accountTail,
    reference,
    timestamp: sms.timestamp,
    sender: sms.sender,
    body,
    bodyHash,
  };
  return { ...parsed, dedupKey: dedupKeyFor(parsed) };
}

/** Whichever of debit/credit is mentioned first wins: "debited … & credited to VPA x" is a debit. */
function detectType(body: string): TxnType | null {
  const debit = DEBIT.exec(body)?.index;
  const credit = CREDIT.exec(body)?.index;
  if (debit === undefined && credit === undefined) return null;
  if (credit === undefined) return 'debit';
  if (debit === undefined) return 'credit';
  return debit < credit ? 'debit' : 'credit';
}

/** First amount that isn't a balance or limit ("Avl Bal Rs 10,000"). */
function findAmount(body: string): number | null {
  for (const match of body.matchAll(AMOUNT)) {
    const start = (match.index ?? 0) + match[1].length;
    const before = body.slice(Math.max(0, start - 24), start).toLowerCase();
    if (before.includes('bal') || before.includes('limit') || before.includes('available')) continue;
    const paise = toPaise(match[2]);
    if (paise) return paise;
  }
  return null;
}

function detectMethod(body: string): PaymentMethod {
  if (/\b(?:atm|cash withdrawal|withdrawn)\b/i.test(body)) return 'atm';
  if (/\b(?:upi|vpa)\b/i.test(body) || VPA.test(body)) return 'upi';
  if (/\bcard\b/i.test(body)) return 'card';
  if (/\b(?:neft|imps|rtgs|nach|ecs|ach)\b/i.test(body)) return 'bank_transfer';
  if (/\bwallet\b/i.test(body)) return 'wallet';
  return 'other';
}

function findMerchant(body: string, type: TxnType): Merchant | null {
  const vpa = VPA.exec(body);
  if (vpa) return merchantFromVpa(vpa[1], vpa[2]);

  const patterns = type === 'debit' ? [AT, TO, INFO, ON] : [FROM, INFO, AT];
  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) {
      const candidate = match[1].trim();
      if (!looksLikeName(candidate)) continue;
      if (pattern === ON && DATE_LIKE.test(candidate)) continue;
      const merchant = merchantFromText(candidate);
      if (merchant) return merchant;
    }
  }
  return null;
}

function looksLikeName(candidate: string): boolean {
  if (NOT_A_NAME.test(candidate)) return false;
  if (/a\/c|acct|account/i.test(candidate)) return false;
  if (/[x*]+\d{3,}/i.test(candidate)) return false;
  return /[a-z]{2}/i.test(candidate);
}
