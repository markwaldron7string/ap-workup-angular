import { caretAfterDigits, isCompleteDateText, maskDateText } from './date-mask';

describe('date mask', () => {
  it('formats date input with protected separators without clamping mid-edit', () => {
    expect(maskDateText('')).toBe('');
    expect(maskDateText('1')).toBe('1');
    expect(maskDateText('13')).toBe('13/');
    expect(maskDateText('123')).toBe('12/3');
    expect(maskDateText('1232')).toBe('12/32/');
    expect(maskDateText('12/31/2026')).toBe('12/31/2026');
  });

  it('spills pasted overflow digits forward into later segments', () => {
    expect(maskDateText('07/152026')).toBe('07/15/2026');
  });

  it('is complete once all eight digits are present', () => {
    expect(isCompleteDateText('07/15/2026')).toBe(true);
    expect(isCompleteDateText('07/15/202')).toBe(false);
  });

  it('places the caret after the same number of digits, past a slash that was just added', () => {
    expect(caretAfterDigits('12/3', 0)).toBe(0);
    expect(caretAfterDigits('12/3', 1)).toBe(1);
    expect(caretAfterDigits('12/', 2)).toBe(3);
    expect(caretAfterDigits('12/31/', 4)).toBe(6);
    expect(caretAfterDigits('12/31/2026', 5)).toBe(7);
    expect(caretAfterDigits('12/3', 9)).toBe(4);
  });
});
