/** Reads "1,200.50" or "$1200.5". Empty, unreadable and non-positive amounts are null. */
export function parseCurrency(str: string): number | null {
  if (!str || !str.trim()) return null;
  const val = parseFloat(str.replace(/[$,\s]/g, ''));
  return isNaN(val) || val <= 0 ? null : val;
}

/** 1200.5 -> "1,200.50" */
export function formatCurrency(val: number): string {
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 1200.5 -> "$1,200.50", -50 -> "-$50.00" */
export function formatDollars(val: number): string {
  return val < 0 ? `-$${formatCurrency(-val)}` : `$${formatCurrency(val)}`;
}

/** Like formatCurrency, but whole amounts drop the cents: 1200 -> "1,200". */
export function formatClipboardCurrency(val: number): string {
  const roundedCents = Math.round(Math.abs(val) * 100) % 100;
  return val.toLocaleString('en-US', {
    minimumFractionDigits: roundedCents === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Keeps digits and a single decimal point. */
export function sanitizeDecimalText(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...fraction] = cleaned.split('.');
  if (fraction.length === 0) return whole;
  return `${whole}.${fraction.join('')}`;
}
