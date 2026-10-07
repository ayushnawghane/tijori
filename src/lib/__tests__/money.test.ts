import { describe, expect, it } from '@jest/globals';

import { formatCompact, formatMoney, groupIndian, toPaise } from '../money';

describe('money', () => {
  it('groups digits the Indian way', () => {
    expect(groupIndian('999')).toBe('999');
    expect(groupIndian('1000')).toBe('1,000');
    expect(groupIndian('123456')).toBe('1,23,456');
    expect(groupIndian('12345678')).toBe('1,23,45,678');
  });

  it('formats paise as rupees', () => {
    expect(formatMoney(4505000)).toBe('₹45,050');
    expect(formatMoney(45050)).toBe('₹450.50');
    expect(formatMoney(-45000)).toBe('−₹450');
    expect(formatMoney(45000, 'always')).toBe('+₹450');
  });

  it('formats compact amounts', () => {
    expect(formatCompact(95000)).toBe('₹950');
    expect(formatCompact(1240000)).toBe('₹12.4K');
    expect(formatCompact(32000000)).toBe('₹3.2L');
  });

  it('parses SMS amounts without float errors', () => {
    expect(toPaise('1,23,456.7')).toBe(12345670);
    expect(toPaise('0.29')).toBe(29);
    expect(toPaise('450.')).toBe(45000);
    expect(toPaise('abc')).toBeNull();
  });
});
