/**
 * Indian SMS sender IDs look like "AD-HDFCBK" or "JD-SBIUPI-S": an operator/circle
 * prefix, a 6-character header registered by the business, and (since 2023) an
 * optional category suffix. The header is what identifies the bank.
 */
const BANK_HEADERS: Record<string, string> = {
  HDFCBK: 'HDFC Bank',
  HDFCBN: 'HDFC Bank',
  HDFCCC: 'HDFC Bank',
  SBIINB: 'SBI',
  SBIUPI: 'SBI',
  SBIPSG: 'SBI',
  SBMSMS: 'SBI',
  CBSSBI: 'SBI',
  ATMSBI: 'SBI',
  SBIBNK: 'SBI',
  SBICRD: 'SBI Card',
  ICICIB: 'ICICI Bank',
  ICICIT: 'ICICI Bank',
  ICICIO: 'ICICI Bank',
  AXISBK: 'Axis Bank',
  AXISCC: 'Axis Bank',
  AXISBN: 'Axis Bank',
  KOTAKB: 'Kotak',
  KMBANK: 'Kotak',
  PNBSMS: 'PNB',
  PUNBNK: 'PNB',
  BOBTXN: 'Bank of Baroda',
  BOBSMS: 'Bank of Baroda',
  BOBCRD: 'BOB Card',
  BOIIND: 'Bank of India',
  CANBNK: 'Canara Bank',
  CNRBNK: 'Canara Bank',
  UNIONB: 'Union Bank',
  UBININ: 'Union Bank',
  IDFCFB: 'IDFC First',
  INDUSB: 'IndusInd',
  YESBNK: 'Yes Bank',
  FEDBNK: 'Federal Bank',
  AUBANK: 'AU Bank',
  SCBANK: 'Standard Chartered',
  CITIBK: 'Citi',
  AMEXIN: 'American Express',
  IDBIBK: 'IDBI Bank',
  CENTBK: 'Central Bank',
  IOBCHN: 'Indian Overseas Bank',
  INDBNK: 'Indian Bank',
  UCOBNK: 'UCO Bank',
  RBLBNK: 'RBL Bank',
  RBLCRD: 'RBL Card',
  BANDHN: 'Bandhan Bank',
  PAYTMB: 'Paytm Payments Bank',
  AIRBNK: 'Airtel Payments Bank',
  JUPITR: 'Jupiter',
  FIMONY: 'Fi',
  ONECRD: 'OneCard',
};

/** Extracts the 6-character business header, or null for phone numbers (personal SMS). */
export function senderHeader(sender: string): string | null {
  const cleaned = sender.trim().toUpperCase();
  if (!/[A-Z]/.test(cleaned)) return null;
  const parts = cleaned.split('-').filter(Boolean);
  const candidate = parts.length >= 2 ? parts[1] : parts[0];
  return candidate ?? null;
}

export function bankName(header: string | null): string | null {
  if (!header) return null;
  return BANK_HEADERS[header] ?? null;
}
