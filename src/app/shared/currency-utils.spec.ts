import {
  formatClipboardCurrency,
  formatCurrency,
  formatDollars,
  parseCurrency,
  sanitizeDecimalText,
} from './currency-utils';

describe('currency utils', () => {
  it('parses amounts with or without symbols and separators', () => {
    expect(parseCurrency('1200')).toBe(1200);
    expect(parseCurrency('$1,200.50')).toBe(1200.5);
    expect(parseCurrency(' 12.5 ')).toBe(12.5);
  });

  it('treats empty, unreadable and non-positive amounts as missing', () => {
    expect(parseCurrency('')).toBeNull();
    expect(parseCurrency('   ')).toBeNull();
    expect(parseCurrency('abc')).toBeNull();
    expect(parseCurrency('0')).toBeNull();
  });

  it('formats amounts with two decimals', () => {
    expect(formatCurrency(1200.5)).toBe('1,200.50');
    expect(formatCurrency(-100)).toBe('-100.00');
  });

  it('puts the minus sign of a negative dollar amount before the symbol', () => {
    expect(formatDollars(1200.5)).toBe('$1,200.50');
    expect(formatDollars(-50)).toBe('-$50.00');
    expect(formatDollars(0)).toBe('$0.00');
  });

  it('drops the cents from whole amounts on the clipboard', () => {
    expect(formatClipboardCurrency(1200)).toBe('1,200');
    expect(formatClipboardCurrency(1200.5)).toBe('1,200.50');
  });

  it('keeps only digits and a single decimal point', () => {
    expect(sanitizeDecimalText('$1a2.3b4')).toBe('12.34');
    expect(sanitizeDecimalText('1.2.3')).toBe('1.23');
    expect(sanitizeDecimalText('abc')).toBe('');
  });
});
