export function countDigits(value: string): number {
  return value.replace(/\D/g, '').length;
}

/**
 * Shapes whatever has been typed into mm/dd/yyyy, adding the slashes as each part fills up.
 * Digits that overflow one part spill into the next, so "07/152026" becomes "07/15/2026".
 */
export function maskDateText(value: string): string {
  const parts = value.split('/');
  const rawMonth = (parts[0] ?? '').replace(/\D/g, '');
  const rawDay = (parts[1] ?? '').replace(/\D/g, '');
  const rawYear = parts.slice(2).join('').replace(/\D/g, '');

  const month = rawMonth.slice(0, 2);
  const dayDigits = rawMonth.slice(2) + rawDay;
  const day = dayDigits.slice(0, 2);
  const yearDigits = dayDigits.slice(2) + rawYear;
  const year = yearDigits.slice(0, 4);

  let formatted = month;
  if (month.length === 2 || day || year) formatted += `/${day}`;
  if (day.length === 2 || year) formatted += `/${year}`;
  return formatted;
}

export function isCompleteDateText(value: string): boolean {
  return countDigits(value) === 8;
}

/**
 * Where the caret belongs in masked text so that it still sits after the same number of digits
 * as before the text was reshaped. It hops over a slash that the mask has just added.
 */
export function caretAfterDigits(masked: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return 0;

  let count = 0;
  for (let i = 0; i < masked.length; i++) {
    if (/\d/.test(masked[i])) {
      count++;
      if (count === digitsBefore) {
        const pos = i + 1;
        if ((digitsBefore === 2 || digitsBefore === 4) && masked[pos] === '/') return pos + 1;
        return pos;
      }
    }
  }

  return masked.length;
}
