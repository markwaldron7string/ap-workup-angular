import { addMonths, dateDiff, formatLongDate, formatShortDate, parseDate } from './date-utils';

describe('date utils', () => {
  it('parses the supported date formats', () => {
    const expected = new Date(2026, 6, 4, 12).getTime();

    expect(parseDate('07/04/2026')?.getTime()).toBe(expected);
    expect(parseDate('7/4/2026')?.getTime()).toBe(expected);
    expect(parseDate('2026-07-04')?.getTime()).toBe(expected);
    expect(parseDate('07042026')?.getTime()).toBe(expected);
    expect(parseDate(' 7/4/26 ')?.getTime()).toBe(expected);
  });

  it('reads two-digit years up to 30 as 20xx and the rest as 19xx', () => {
    expect(parseDate('1/1/30')?.getFullYear()).toBe(2030);
    expect(parseDate('1/1/31')?.getFullYear()).toBe(1931);
  });

  it('rejects text that is not a date', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate('07/04')).toBeNull();
    expect(parseDate('13/45/2026')).toBeNull();
  });

  it('formats short and long dates', () => {
    const date = new Date(2026, 6, 4, 12);

    expect(formatShortDate(date)).toBe('07/04/2026');
    expect(formatLongDate(date)).toBe('July 4, 2026');
  });

  it('adds months, clamping to the end of a shorter month', () => {
    expect(formatShortDate(addMonths(new Date(2010, 0, 1, 12), 192))).toBe('01/01/2026');
    expect(formatShortDate(addMonths(new Date(2025, 0, 31, 12), 1))).toBe('02/28/2025');
    expect(formatShortDate(addMonths(new Date(2024, 0, 31, 12), 1))).toBe('02/29/2024');
  });

  it('measures the years, months and days between two dates', () => {
    expect(dateDiff(new Date(2024, 6, 1), new Date(2026, 0, 1))).toEqual({
      years: 1,
      months: 6,
      days: 0,
    });
    expect(dateDiff(new Date(2025, 0, 15), new Date(2025, 2, 10))).toEqual({
      years: 0,
      months: 1,
      days: 23,
    });
    expect(dateDiff(new Date(2016, 5, 15), new Date(2026, 5, 15))).toEqual({
      years: 10,
      months: 0,
      days: 0,
    });
    expect(dateDiff(new Date(2025, 10, 20), new Date(2026, 0, 5))).toEqual({
      years: 0,
      months: 1,
      days: 16,
    });
  });

  it('never reports negative days when the start day does not exist in a later month', () => {
    // Jan 31 + 1 month is Feb 28, so Mar 1 is one month and one day on.
    expect(dateDiff(new Date(2025, 0, 31), new Date(2025, 2, 1))).toEqual({
      years: 0,
      months: 1,
      days: 1,
    });
    expect(dateDiff(new Date(2025, 0, 30), new Date(2025, 2, 1))).toEqual({
      years: 0,
      months: 1,
      days: 1,
    });
    expect(dateDiff(new Date(2024, 0, 31), new Date(2024, 2, 1))).toEqual({
      years: 0,
      months: 1,
      days: 1,
    });
    expect(dateDiff(new Date(2016, 0, 31), new Date(2026, 2, 2))).toEqual({
      years: 10,
      months: 1,
      days: 2,
    });
  });

  it('counts days across a daylight-saving change without drifting', () => {
    expect(dateDiff(new Date(2026, 2, 1, 12), new Date(2026, 2, 31, 12)).days).toBe(30);
    expect(dateDiff(new Date(2026, 9, 20, 12), new Date(2026, 10, 19, 12)).days).toBe(30);
  });
});
