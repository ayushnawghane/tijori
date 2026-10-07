/**
 * Money is stored as integer paise everywhere to avoid floating-point drift.
 * Formatting uses Indian digit grouping (1,23,45,678).
 */

/** Groups a string of digits the Indian way: last three, then pairs. */
export function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  const pairs: string[] = [];
  for (let end = head.length; end > 0; end -= 2) {
    pairs.unshift(head.slice(Math.max(0, end - 2), end));
  }
  return `${pairs.join(',')},${tail}`;
}

type SignMode = 'negative-only' | 'always' | 'never';

/** 4505000 → "₹45,050"; 45050 → "₹450.50". Paise are shown only when non-zero. */
export function formatMoney(paise: number, sign: SignMode = 'negative-only'): string {
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100);
  const fraction = abs % 100;
  const body = groupIndian(String(rupees)) + (fraction ? `.${String(fraction).padStart(2, '0')}` : '');

  let prefix = '';
  if (sign !== 'never') {
    if (paise < 0) prefix = '−';
    else if (sign === 'always' && paise > 0) prefix = '+';
  }
  return `${prefix}₹${body}`;
}

/** Short form for tight spaces: ₹950, ₹12.4K, ₹3.2L, ₹1.1Cr. */
export function formatCompact(paise: number): string {
  const rupees = Math.abs(paise) / 100;
  const sign = paise < 0 ? '−' : '';
  const trim = (n: number) => (n >= 100 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, ''));
  if (rupees >= 1e7) return `${sign}₹${trim(rupees / 1e7)}Cr`;
  if (rupees >= 1e5) return `${sign}₹${trim(rupees / 1e5)}L`;
  if (rupees >= 1e3) return `${sign}₹${trim(rupees / 1e3)}K`;
  return `${sign}₹${Math.round(rupees)}`;
}

/** Parses an amount as written in an SMS ("1,23,456.7") into paise without float maths. */
export function toPaise(amount: string): number | null {
  const cleaned = amount.replace(/,/g, '').replace(/\.$/, '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const rupees = Number(match[1]);
  const paise = Number((match[2] ?? '').padEnd(2, '0'));
  return rupees * 100 + paise;
}
