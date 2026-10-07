import { describe, expect, it } from '@jest/globals';

import { categorize } from '../parser/categorizer';
import { parseSms } from '../parser/sms-parser';
import type { RawSms } from '../types';

const T = 1_780_000_000_000;
const sms = (sender: string, body: string): RawSms => ({ sender, body, timestamp: T });
const noRules = new Map();

describe('parseSms — debits', () => {
  it('reads a UPI debit to a merchant VPA', () => {
    const p = parseSms(
      sms('AD-HDFCBK-S', 'Rs.450.00 debited from A/c XX1234 on 05-10-26 to VPA swiggy@icici. UPI Ref 627812345678. Not you? Call 18002586161'),
    )!;
    expect(p).toMatchObject({
      amountPaise: 45000,
      type: 'debit',
      method: 'upi',
      merchant: 'Swiggy',
      bank: 'HDFC Bank',
      accountTail: '1234',
      reference: '627812345678',
    });
    expect(categorize(p, noRules)).toBe('food');
  });

  it('reads the HDFC "Sent Rs… To MERCHANT On…" format', () => {
    const p = parseSms(
      sms('VM-HDFCBK', 'Sent Rs.250.00\nFrom HDFC Bank A/C *1234\nTo ZOMATO\nOn 05/10/26\nRef 627812345679\nNot You?\nCall 18002586161/SMS BLOCK UPI to 7308080808'),
    )!;
    expect(p).toMatchObject({ amountPaise: 25000, type: 'debit', merchant: 'Zomato', accountTail: '1234' });
  });

  it('reads a credit card spend and ignores "Credit Card" as a credit', () => {
    const p = parseSms(
      sms('JD-ICICIB-S', 'INR 799.00 spent using ICICI Bank Card XX5678 on 04-Oct-26 on AMAZON PAY IN. Avl Limit: INR 1,52,340.00. If not you, call 1800 2662/SMS BLOCK 5678 to 9215676766'),
    )!;
    expect(p).toMatchObject({ amountPaise: 79900, type: 'debit', method: 'card', accountTail: '5678', merchant: 'Amazon' });
    expect(categorize(p, noRules)).toBe('shopping');
  });

  it('uses the "at MERCHANT" pattern on card spends', () => {
    const p = parseSms(
      sms('AX-AXISBK', 'Spent INR 1,240.50 at STARBUCKS COFFEE on your Axis Bank Credit Card XX9012 on 03-10-26. Avl Lmt INR 80,000'),
    )!;
    expect(p).toMatchObject({ amountPaise: 124050, merchant: 'Starbucks' });
    expect(categorize(p, noRules)).toBe('food');
  });

  it('takes the transaction amount, not the balance', () => {
    const p = parseSms(
      sms('BZ-SBIINB', 'Dear Customer, Avl Bal Rs 10,000.00 in A/c XX4321 after debit of Rs 300.00 on 04Oct26 to VPA 9876543210@ybl. Ref no 627800000001 -SBI'),
    )!;
    expect(p.amountPaise).toBe(30000);
    expect(p.isPerson).toBe(true);
    expect(categorize(p, noRules)).toBe('transfers');
  });

  it('treats "debited … & credited to" as a debit', () => {
    const p = parseSms(
      sms('CP-SBIUPI', 'Dear UPI user A/C X4321 debited by 120.0 on date 05Oct26 trf to RAHUL SHARMA Refno 627811112222. If not u? call 1800111109. -SBI'),
    );
    // No currency marker on the amount — we'd rather skip than guess.
    expect(p).toBeNull();

    const q = parseSms(
      sms('CP-KOTAKB', 'Acct XX777 debited with INR 300.00 on 04-Oct-26 & credited to VPA rahul.sharma@okaxis. UPI Ref 627833334444'),
    )!;
    expect(q).toMatchObject({ type: 'debit', merchant: 'Rahul Sharma', isPerson: true, bank: 'Kotak' });
  });

  it('marks ATM withdrawals as cash', () => {
    const p = parseSms(sms('AD-SBIINB', 'Rs 2,000 withdrawn at ATM from A/c XX4321 on 02-10-26. Avl Bal Rs 8,000'))!;
    expect(p).toMatchObject({ method: 'atm', merchant: 'ATM withdrawal', amountPaise: 200000 });
    expect(categorize(p, noRules)).toBe('cash');
  });
});

describe('parseSms — credits', () => {
  it('reads a NEFT salary credit', () => {
    const p = parseSms(
      sms('AD-HDFCBK', 'INR 52,000.00 credited to A/c XX1234 on 01-10-26 by NEFT-ACME CORP SALARY. Avl Bal INR 61,234.50'),
    )!;
    expect(p).toMatchObject({ amountPaise: 5200000, type: 'credit', method: 'bank_transfer', merchant: 'Acme Corp Salary' });
    expect(categorize(p, noRules)).toBe('salary');
  });

  it('reads a refund and keeps it separate from the original debit', () => {
    const debit = parseSms(sms('AD-HDFCBK', 'Rs.450.00 debited from A/c XX1234 to VPA swiggy@icici. UPI Ref 627812345678'))!;
    const refund = parseSms(sms('AD-HDFCBK', 'Rs.450.00 credited to A/c XX1234 as refund from VPA swiggy@icici. UPI Ref 627812345678'))!;
    expect(refund.type).toBe('credit');
    expect(categorize(refund, noRules)).toBe('refund');
    expect(refund.dedupKey).not.toBe(debit.dedupKey);
  });
});

describe('parseSms — ignores non-transactions', () => {
  const ignored: [string, string][] = [
    ['OTP', 'Your OTP for transaction of Rs 4,999 at AMAZON is 482910. Do not share. -HDFC Bank'],
    ['due reminder', 'Your HDFC Bank Credit Card XX5678 statement: Total Amt Due Rs 12,340, Min Amt Due Rs 620 is due on 15-10-26.'],
    ['mandate notice', 'Rs 599 will be debited from A/c XX1234 on 10-10-26 towards NETFLIX mandate.'],
    ['collect request', 'ZOMATO has requested money of Rs 250 from you on Google Pay. Approve on your UPI app.'],
    ['failed payment', 'Your UPI transaction of Rs 300 to SWIGGY has failed. Amount if debited will be refunded.'],
    ['card bill acknowledgement', 'Payment of Rs 12,340 received towards your HDFC Bank Credit Card XX5678. Thank you.'],
  ];

  it.each(ignored)('skips %s', (_label, body) => {
    expect(parseSms(sms('AD-HDFCBK', body))).toBeNull();
  });

  it('never parses SMS from personal phone numbers', () => {
    expect(parseSms(sms('+919876543210', 'Rs 500 debited from A/c XX1234 to VPA a@ybl'))).toBeNull();
  });

  it('skips unknown senders that do not mention an account or card', () => {
    expect(parseSms(sms('VM-SHOPRX', 'Payment of Rs 499 received for order #1234. Thanks for shopping!'))).toBeNull();
  });
});

describe('categorize — user rules', () => {
  it('lets a merchant rule override the keyword guess', () => {
    const p = parseSms(sms('AD-HDFCBK', 'Rs.450.00 debited from A/c XX1234 to VPA swiggy@icici. UPI Ref 627812345678'))!;
    const rules = new Map([[`debit:${p.merchantKey}`, 'groceries' as const]]);
    expect(categorize(p, rules)).toBe('groceries');
  });
});
