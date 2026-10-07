export interface DateDiff {
  years: number;
  months: number;
  days: number;
}

/**
 * Accepts yyyy-mm-dd, m/d/yyyy, m/d/yy and mmddyyyy. Dates are created at noon so that
 * daylight-saving shifts can never move them onto a neighbouring day.
 */
export function parseDate(str: string): Date | null {
  if (!str) return null;
  const trimmed = str.trim();
  let m: string | undefined;
  let d: string | undefined;
  let y: string | undefined;
  let match = trimmed.match(/^(\d{4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})$/);
  if (match) [, y, m, d] = match;
  if (!y) {
    match = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{4})$/);
    if (match) [, m, d, y] = match;
  }
  if (!y) {
    match = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2})$/);
    if (match) {
      [, m, d, y] = match;
      y = `${parseInt(y, 10) <= 30 ? '20' : '19'}${y}`;
    }
  }
  if (!y) {
    match = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (match) [, m, d, y] = match;
  }
  if (!m || !d || !y) return null;
  const date = new Date(
    `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00`,
  );
  return isNaN(date.getTime()) ? null : date;
}

/** 07/04/2026 */
export function formatShortDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

/** July 4, 2026 */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Adds calendar months, clamping to the end of the month (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

/**
 * Whole years and months from one date to a later one, plus the days left over.
 * The leftover days are counted from the last monthly anniversary, found with addMonths so that
 * a start on the 31st is handled the same way as everywhere else (Jan 31 to Mar 1 is 1 month, 1 day).
 */
export function dateDiff(from: Date, to: Date): DateDiff {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  if (to.getDate() < from.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  const anniversary = addMonths(from, years * 12 + months);
  return { years, months, days: daysBetween(anniversary, to) };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Calendar days between two dates, ignoring their times of day and any daylight-saving shift. */
function daysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / MS_PER_DAY);
}
