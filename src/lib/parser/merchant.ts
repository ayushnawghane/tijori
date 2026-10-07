import { METHOD_LABEL, type PaymentMethod, type TxnType } from '../types';

export interface Merchant {
  display: string;
  key: string;
  isPerson: boolean;
}

/** Well-known brands, matched against the merchant text with spaces/punctuation removed. */
const KNOWN_LONG: [string, string][] = [
  ['jiomart', 'JioMart'],
  ['jiocinema', 'JioCinema'],
  ['swiggy', 'Swiggy'],
  ['zomato', 'Zomato'],
  ['amazon', 'Amazon'],
  ['flipkart', 'Flipkart'],
  ['myntra', 'Myntra'],
  ['olacabs', 'Ola'],
  ['rapido', 'Rapido'],
  ['irctc', 'IRCTC'],
  ['netflix', 'Netflix'],
  ['spotify', 'Spotify'],
  ['hotstar', 'Hotstar'],
  ['airtel', 'Airtel'],
  ['zepto', 'Zepto'],
  ['blinkit', 'Blinkit'],
  ['bigbasket', 'BigBasket'],
  ['dmart', 'DMart'],
  ['bookmyshow', 'BookMyShow'],
  ['makemytrip', 'MakeMyTrip'],
  ['starbucks', 'Starbucks'],
  ['dominos', "Domino's"],
  ['mcdonald', "McDonald's"],
  ['zerodha', 'Zerodha'],
  ['groww', 'Groww'],
  ['youtube', 'YouTube'],
  ['phonepe', 'PhonePe'],
  ['nykaa', 'Nykaa'],
  ['meesho', 'Meesho'],
  ['uber', 'Uber'],
];

/** Short brand names only match at the start, so "ola" doesn't hit "motorola". */
const KNOWN_SHORT: [string, string][] = [
  ['ajio', 'AJIO'],
  ['jio', 'Jio'],
  ['ola', 'Ola'],
  ['kfc', 'KFC'],
  ['pvr', 'PVR'],
];

/** UPI handles used by individuals — a payment to one of these is usually a person. */
const PERSONAL_PSPS = new Set([
  'ybl', 'ibl', 'axl', 'okaxis', 'okhdfcbank', 'oksbi', 'okicici', 'paytm', 'pthdfc', 'ptsbi',
  'ptaxis', 'ptyes', 'apl', 'yapl', 'upi', 'axisbank', 'icici', 'hdfcbank', 'sbi', 'kotak',
  'kmbl', 'fam', 'freecharge', 'jupiteraxis', 'fifederal', 'federal', 'idfcbank', 'indus',
  'aubank', 'yesbank', 'airtel', 'jio', 'superyes', 'naviaxis', 'slc', 'abfspay', 'pingpay',
  'dlb', 'unionbank', 'barodampay', 'pnb', 'cnrb', 'boi', 'mahb', 'ikwik', 'waaxis', 'waicici',
  'wahdfcbank', 'wasbi',
]);

/** Handle prefixes used by shop QR codes and payment gateways. */
const MERCHANT_QR = /^(?:paytmqr|paytm\.s|bharatpe|q\d|gpay-|mab\.|pos\.|yespay|ezetap|razorpay|rzp|mswipe|pinelabs|stq|merchant|biz|vyapar)/;

const ACRONYMS = new Set(['atm', 'upi', 'emi', 'lic', 'hdfc', 'sbi', 'icici', 'irctc', 'kfc', 'pvr', 'bsnl', 'hp', 'bp', 'ltd', 'llp']);

const PREFIX = /^(?:neft|imps|rtgs|upi|pos|ecom|vps|mps|ach|nach|bil|billpay|ib|inf|mmt|p2a|p2m|p2p)[\s\-/*:]+/i;

function compact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchKnown(text: string): Merchant | null {
  const c = compact(text);
  for (const [key, display] of KNOWN_LONG) {
    if (c.includes(key)) return { display, key: `m:${key}`, isPerson: false };
  }
  for (const [key, display] of KNOWN_SHORT) {
    if (c.startsWith(key)) return { display, key: `m:${key}`, isPerson: false };
  }
  return null;
}

function titleCase(text: string): string {
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      if (/\d/.test(word)) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/** Strips rail prefixes ("NEFT-", "UPI/"), long reference numbers and stray punctuation. */
export function cleanMerchantText(raw: string): string | null {
  let s = raw.trim();
  for (let i = 0; i < 3; i++) s = s.replace(PREFIX, '');
  s = s
    .replace(/\b[a-z]*\d{5,}[a-z0-9]*\b/gi, ' ')
    .replace(/^[\s\-/*_.]+|[\s\-/*_.]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (s.length < 2 || !/[a-z]{2}/i.test(s)) return null;
  return s;
}

export function merchantFromVpa(handle: string, psp: string): Merchant {
  const h = handle.toLowerCase();
  const p = psp.toLowerCase();
  const key = `upi:${h}@${p}`;

  const known = matchKnown(h);
  if (known) return known;

  if (/^\+?\d+$/.test(h)) {
    return { display: `UPI ••${h.slice(-4)}`, key, isPerson: true };
  }
  if (MERCHANT_QR.test(h)) {
    return { display: `UPI merchant ••${compact(h).slice(-4)}`, key, isPerson: false };
  }

  const words = h
    .split(/[._-]+/)
    .map((w) => w.replace(/[^a-z]/g, ''))
    .filter((w) => w.length >= 2);
  const display = words.length ? titleCase(words.join(' ')) : h;
  return { display, key, isPerson: PERSONAL_PSPS.has(p) };
}

export function merchantFromText(raw: string): Merchant | null {
  const cleaned = cleanMerchantText(raw);
  if (!cleaned) return null;
  const known = matchKnown(cleaned);
  if (known) return known;
  return { display: titleCase(cleaned), key: `m:${compact(cleaned)}`, isPerson: false };
}

/** Used when the SMS names no counterparty at all. Empty key = no merchant rules. */
export function fallbackMerchant(type: TxnType, method: PaymentMethod): Merchant {
  if (method === 'atm') return { display: 'ATM withdrawal', key: 'm:atm', isPerson: false };
  if (type === 'credit') return { display: 'Money received', key: '', isPerson: false };
  const display = method === 'other' ? 'Payment' : `${METHOD_LABEL[method]} payment`;
  return { display, key: '', isPerson: false };
}
