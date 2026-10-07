import type { CategoryId } from '../categories';
import type { ParsedTransaction, TxnType } from '../types';

/**
 * Rule-based categorisation, in priority order:
 *   1. the user's own "always use this category for <merchant>" rules
 *   2. income signals (salary, refunds, person-to-person)
 *   3. brand / keyword lists below
 *   4. a few unambiguous signals in the SMS body
 */

/** Order matters: "Swiggy Instamart" must hit groceries before "swiggy" hits food. */
const KEYWORDS: [CategoryId, string[]][] = [
  ['groceries', ['blinkit', 'zepto', 'bigbasket', 'instamart', 'dmart', 'jiomart', 'grofers', 'reliance fresh', 'reliance smart', 'more retail', 'natures basket', 'spencers', 'country delight', 'milkbasket', 'licious', 'grocery', 'groceries', 'supermarket', 'kirana', 'mart']],
  ['food', ['swiggy', 'zomato', 'eatsure', 'domino', 'dominos', 'pizza', 'pizzahut', 'mcdonald', 'mcdonalds', 'kfc', 'burger', 'burger king', 'starbucks', 'cafe', 'coffee', 'restaurant', 'restaurants', 'dhaba', 'chaayos', 'haldiram', 'haldirams', 'subway', 'barbeque', 'dunkin', 'biryani', 'bakery', 'food', 'foods', 'eats', 'kitchen']],
  ['entertainment', ['netflix', 'spotify', 'hotstar', 'disney', 'prime video', 'primevideo', 'sonyliv', 'zee5', 'jiocinema', 'jio cinema', 'bookmyshow', 'pvr', 'inox', 'cinepolis', 'youtube', 'google play', 'apple.com', 'itunes', 'steam', 'playstation', 'xbox', 'gaana', 'wynk', 'audible']],
  ['shopping', ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'tata cliq', 'tatacliq', 'croma', 'reliance digital', 'decathlon', 'ikea', 'lenskart', 'snapdeal', 'firstcry', 'shoppers stop', 'lifestyle', 'pantaloons', 'westside', 'zara', 'h&m', 'uniqlo', 'store', 'mall']],
  ['transport', ['uber', 'ola', 'olacabs', 'rapido', 'irctc', 'redbus', 'makemytrip', 'goibibo', 'indigo', 'air india', 'vistara', 'akasa', 'spicejet', 'metro', 'fastag', 'petrol', 'fuel', 'hpcl', 'bpcl', 'iocl', 'indian oil', 'shell', 'yatra', 'cleartrip', 'ixigo', 'blusmart', 'namma yatri', 'parking', 'toll', 'railway', 'airlines', 'airways']],
  ['bills', ['airtel', 'jio', 'vodafone', 'bsnl', 'electricity', 'bescom', 'tata power', 'adani electricity', 'msedcl', 'mseb', 'bses', 'torrent power', 'tneb', 'kseb', 'cesc', 'piped gas', 'indane', 'bharat gas', 'hp gas', 'broadband', 'fibernet', 'hathway', 'tata play', 'dish tv', 'recharge', 'bill payment', 'billdesk', 'water bill', 'postpaid', 'prepaid']],
  ['health', ['apollo', 'pharmeasy', '1mg', 'netmeds', 'medplus', 'practo', 'hospital', 'hospitals', 'clinic', 'pharmacy', 'chemist', 'medical', 'medicals', 'diagnostics', 'diagnostic', 'pathlabs', 'cult.fit', 'cultfit', 'gym', 'fitness', 'healthkart']],
  ['education', ['udemy', 'coursera', 'byju', 'byjus', 'unacademy', 'school', 'college', 'university', 'tuition', 'upgrad', 'vedantu', 'physics wallah', 'physicswallah', 'skillshare', 'academy']],
  ['investments', ['zerodha', 'groww', 'upstox', 'angel one', 'angel broking', 'kuvera', 'paytm money', 'indmoney', 'smallcase', 'mutual fund', 'mutual funds', 'iccl', 'indian clearing', 'nse clearing', 'clearing corp', 'et money', 'scripbox']],
  ['emi', ['emi', 'loan', 'bajaj finance', 'bajaj finserv', 'home credit', 'lic', 'insurance', 'policy', 'premium', 'hdfc life', 'icici pru', 'sbi life', 'tata aia', 'acko', 'policybazaar']],
  ['rent', ['rent', 'nobroker', 'housing.com', 'maintenance', 'society', 'landlord', 'nestaway']],
];

/** Lower-cases, drops apostrophes, turns other punctuation into spaces, pads with spaces. */
function normalise(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9.&]+/g, ' ')
    .trim();
  return ` ${cleaned} `;
}

const NORMALISED_KEYWORDS: [CategoryId, string[]][] = KEYWORDS.map(([id, words]) => [
  id,
  words.map((w) => normalise(w)),
]);

export function matchKeywords(text: string): CategoryId | null {
  const haystack = normalise(text);
  for (const [id, words] of NORMALISED_KEYWORDS) {
    if (words.some((w) => haystack.includes(w))) return id;
  }
  return null;
}

export function ruleKey(type: TxnType, merchantKey: string): string {
  return `${type}:${merchantKey}`;
}

export function categorize(p: ParsedTransaction, rules: ReadonlyMap<string, CategoryId>): CategoryId {
  if (p.merchantKey) {
    const ruled = rules.get(ruleKey(p.type, p.merchantKey));
    if (ruled) return ruled;
  }

  const body = p.body.toLowerCase();

  if (p.type === 'credit') {
    if (/\b(?:salary|payroll|sal)\b/.test(body)) return 'salary';
    if (/\b(?:refund|refunded|reversal|reversed|cashback|chargeback)\b/.test(body)) return 'refund';
    if (p.isPerson) return 'transfers';
    return 'other_income';
  }

  if (p.method === 'atm') return 'cash';

  const byMerchant = matchKeywords(p.merchant);
  if (byMerchant) return byMerchant;

  // Card SMS often append "convert to EMI" promos, so only trust EMI hints on bank debits.
  if (p.method === 'bank_transfer' && /\b(?:nach|ecs|emi)\b/.test(body)) return 'emi';
  if (/\bfastag\b/.test(body)) return 'transport';
  if (/\b(?:mutual fund|sip)\b/.test(body)) return 'investments';

  if (p.isPerson) return 'transfers';
  return 'uncategorized';
}
