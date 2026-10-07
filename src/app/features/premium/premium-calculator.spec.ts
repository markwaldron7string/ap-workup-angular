import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeService } from '../../core/theme.service';
import { domOf, installStorageMock, mockClipboard } from '../../../testing/dom';
import { PremiumCalculator } from './premium-calculator';

describe('PremiumCalculator', () => {
  let fixture: ComponentFixture<PremiumCalculator>;
  let dom: ReturnType<typeof domOf<PremiumCalculator>>;

  const value = (selector: string): string => dom.get<HTMLInputElement>(selector).value;

  beforeEach(() => {
    installStorageMock();
    fixture = TestBed.createComponent(PremiumCalculator);
    fixture.detectChanges();
    dom = domOf(fixture);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('form (light and dark themes)', () => {
    it('calculates an increase and clears back to empty', () => {
      dom.typeInto('#premOldInput', '1000');
      dom.typeInto('#premNewInput', '1200');
      dom.click('.premium-card .btn');

      expect(dom.get('.result').classList.contains('success')).toBe(true);
      expect(dom.text('.result-title')).toBe('Premium increase');
      expect(dom.text('.prem-pct')).toBe('+20.0%');
      expect(dom.get('.prem-pct').classList.contains('increase')).toBe(true);

      dom.click('.premium-card .btn-clear');

      expect(value('#premOldInput')).toBe('');
      expect(value('#premNewInput')).toBe('');
      expect(dom.query('.result')).toBeNull();
    });

    it('adds a fixed fee pill and removes it again, restoring the original premiums', () => {
      dom.typeInto('#premOldInput', '1000');
      dom.typeInto('#premNewInput', '1200');
      dom.typeInto('#premFeeInput', '25');
      expect(dom.query('.prem-orig-ref')).toBeNull();

      dom.click('.fee-add-btn');

      expect(dom.text('.fee-pill')).toContain('$25.00');
      expect(dom.get('.fee-remove-btn').getAttribute('aria-label')).toBe('Remove $25.00 fixed fee');
      expect(dom.text('.prem-orig-ref')).toContain('Fixed fees: $25.00');
      expect(value('#premOldInput')).toBe('975.00');
      expect(value('#premNewInput')).toBe('1,175.00');
      expect(value('#premFeeInput')).toBe('');

      dom.click('.fee-remove-btn');

      expect(dom.query('.fee-pill')).toBeNull();
      expect(dom.query('.prem-orig-ref')).toBeNull();
      expect(value('#premOldInput')).toBe('1,000.00');
      expect(value('#premNewInput')).toBe('1,200.00');
    });

    it('adds a fixed fee when Enter is pressed in the fee field', () => {
      dom.typeInto('#premFeeInput', '12.5');

      dom.get('#premFeeInput').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();

      expect(dom.text('.fee-pill')).toContain('$12.50');
    });

    it('shows a warning card instead of adding a fee that exceeds the premium', () => {
      dom.typeInto('#premOldInput', '100');
      dom.typeInto('#premNewInput', '200');
      dom.typeInto('#premFeeInput', '150');

      dom.click('.fee-add-btn');

      expect(dom.query('.fee-pill')).toBeNull();
      expect(dom.get('.result').classList.contains('warn')).toBe(true);
      expect(dom.text('.result-title')).toBe('Fixed fee exceeds premium');
      expect(dom.text('.result-body')).toBe(
        'Adding a fee of $150.00 would leave an adjusted old premium of -$50.00 and adjusted new premium of $50.00. Please verify the fee.',
      );
      expect(dom.query('.result-copy-btn')).toBeNull();
    });

    it('sanitizes pasted premium input to numeric characters only', () => {
      const input = dom.get<HTMLInputElement>('#premOldInput');
      input.value = '10';
      input.setSelectionRange(2, 2);
      const paste = new Event('paste', { cancelable: true });
      Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '$1a2.3b4' } });

      input.dispatchEvent(paste);
      fixture.detectChanges();

      expect(paste.defaultPrevented).toBe(true);
      expect(input.value).toBe('1012.34');

      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(input.value).toBe('1,012.34');
    });

    it('blocks keys that are not part of a number', () => {
      const press = (key: string): boolean => {
        const event = new KeyboardEvent('keydown', { key, cancelable: true });
        dom.get('#premOldInput').dispatchEvent(event);
        return event.defaultPrevented;
      };

      expect(press('a')).toBe(true);
      expect(press('5')).toBe(false);
      expect(press('.')).toBe(false);
      expect(press('Backspace')).toBe(false);
      expect(press('Escape')).toBe(false);
      expect(press('PageDown')).toBe(false);
    });

    it('allows only one decimal point', () => {
      const input = dom.get<HTMLInputElement>('#premOldInput');
      const pressPoint = (): boolean => {
        const event = new KeyboardEvent('keydown', { key: '.', cancelable: true });
        input.dispatchEvent(event);
        return event.defaultPrevented;
      };

      input.value = '12.5';
      input.setSelectionRange(4, 4);
      expect(pressPoint()).toBe(true);

      // Typing over a selection that contains the existing point is fine.
      input.setSelectionRange(0, 4);
      expect(pressPoint()).toBe(false);
    });

    it('copies the result text and the all-caps variant from their buttons', () => {
      vi.useFakeTimers();
      const writeText = mockClipboard();
      const copyText = 'Old premium: $100\nNew premium: $200\n% Difference: 100.0%';
      dom.typeInto('#premOldInput', '100');
      dom.typeInto('#premNewInput', '200');
      dom.click('.premium-card .btn');

      dom.click('.result-copy-btn');

      expect(writeText).toHaveBeenCalledWith(copyText);
      expect(dom.get('.result-copy-btn').classList.contains('copied')).toBe(true);
      expect(dom.get('.result-copy-btn').getAttribute('aria-label')).toBe('Copied');
      expect(dom.get('.result-secret-btn').getAttribute('aria-label')).toBe('Copy');

      dom.click('.result-secret-btn');

      expect(writeText).toHaveBeenLastCalledWith(copyText.toUpperCase());
      expect(dom.get('.result-secret-btn').classList.contains('copied')).toBe(true);
      expect(dom.get('.result-copy-btn').classList.contains('copied')).toBe(false);

      vi.advanceTimersByTime(2000);
      fixture.detectChanges();

      expect(dom.get('.result-secret-btn').getAttribute('aria-label')).toBe('Copy');
    });

    it('offers no copy buttons for a decrease', () => {
      dom.typeInto('#premOldInput', '100');
      dom.typeInto('#premNewInput', '80');
      dom.click('.premium-card .btn');

      expect(dom.text('.prem-pct')).toBe('-20.0%');
      expect(dom.get('.prem-pct').classList.contains('decrease')).toBe(true);
      expect(dom.query('.result-copy-btn')).toBeNull();
      expect(dom.query('.result-secret-btn')).toBeNull();
    });
  });

  describe('table (original theme)', () => {
    const rows = (): HTMLElement[] => dom.all('.xl-row');
    const cell = (row: number, label: string): HTMLInputElement =>
      dom.get<HTMLInputElement>(`input[aria-label="${label}, row ${row}"]`);
    const outputs = (row: number): string[] =>
      Array.from(rows()[row - 1].querySelectorAll('.xl-out')).map(
        (el) => el.textContent?.trim() ?? '',
      );

    function commit(input: HTMLInputElement, text: string, event: Event = new Event('blur')): void {
      input.value = text;
      input.dispatchEvent(event);
      fixture.detectChanges();
    }

    beforeEach(() => {
      TestBed.inject(ThemeService).set('original');
      fixture.detectChanges();
    });

    it('shows the table in place of the premium form', () => {
      expect(dom.query('.xl-table')).not.toBeNull();
      expect(dom.query('#premOldInput')).toBeNull();
      expect(rows().length).toBe(8);
      expect(dom.all('.xl-example').length).toBe(2);
    });

    it('fills the green cells when a cell is left, without a calculate button', () => {
      commit(cell(1, 'Old premium'), '700');
      expect(outputs(1)).toEqual(['', '']);

      commit(cell(1, 'New premium'), '800');

      expect(cell(1, 'Old premium').value).toBe('700.00');
      expect(outputs(1)).toEqual(['100.00', '+14.3%']);
      expect(dom.text('.xl-detail')).toContain('Premium increase');
      expect(dom.text('.xl-detail')).toContain('$700.00 → $800.00');
      expect(dom.query('.xl-sheet .btn')).toBeNull();
    });

    it('tidies a cell even when its value has not changed', () => {
      commit(cell(1, 'Old premium'), '700');
      expect(cell(1, 'Old premium').value).toBe('700.00');

      commit(cell(1, 'Old premium'), '700');

      expect(cell(1, 'Old premium').value).toBe('700.00');
    });

    it('recalculates on Enter and colours a decrease green', () => {
      commit(cell(2, 'Old premium'), '900');
      commit(cell(2, 'New premium'), '800', new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(outputs(2)).toEqual(['-100.00', '-11.1%']);
      expect(rows()[1].querySelector('.xl-pct')?.classList.contains('decrease')).toBe(true);
    });

    it('adds and removes fixed fees on the row and updates the result each time', () => {
      commit(cell(1, 'Old premium'), '700');
      commit(cell(1, 'New premium'), '800');
      commit(cell(1, 'Fixed fee'), '25', new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(dom.text('.xl-chip')).toContain('25.00');
      expect(cell(1, 'Fixed fee').value).toBe('');
      expect(cell(1, 'Old premium').value).toBe('700.00');
      expect(outputs(1)).toEqual(['100.00', '+14.8%']);
      expect(dom.text('.xl-detail')).toContain('$675.00 → $775.00');
      expect(dom.text('.xl-detail')).toContain('Fixed fees excluded: $25.00');

      dom.click('.xl-chip button');

      expect(dom.query('.xl-chip')).toBeNull();
      expect(outputs(1)).toEqual(['100.00', '+14.3%']);
    });

    it('warns on the bar and keeps the fee out when it exceeds the premium', () => {
      commit(cell(1, 'Old premium'), '700');
      commit(cell(1, 'New premium'), '800');
      commit(cell(1, 'Fixed fee'), '700');

      expect(dom.query('.xl-chip')).toBeNull();
      expect(cell(1, 'Fixed fee').value).toBe('700');
      expect(outputs(1)).toEqual(['', '']);
      expect(dom.get('.xl-detail').classList.contains('warn')).toBe(true);
      expect(dom.text('.xl-detail')).toContain('Fixed fee exceeds premium');
      expect(dom.text('.xl-detail')).toContain('Adding a fee of $700.00 would leave');
    });

    it('shows the selected row on the bar and clears only that row', () => {
      commit(cell(1, 'Old premium'), '100');
      commit(cell(1, 'New premium'), '110');
      commit(cell(2, 'Old premium'), '200');
      commit(cell(2, 'New premium'), '150');

      rows()[1].click();
      fixture.detectChanges();
      expect(dom.text('.xl-name')).toBe('Row 2 of 8');
      expect(dom.text('.xl-detail')).toContain('Premium decrease');

      dom.click('.xl-bar .xl-btn');

      expect(cell(2, 'Old premium').value).toBe('');
      expect(outputs(2)).toEqual(['', '']);
      expect(outputs(1)).toEqual(['10.00', '+10.0%']);
    });

    it('copies an increase from the cell and offers the all-caps copy on the bar', async () => {
      const writeText = mockClipboard();
      commit(cell(1, 'Old premium'), '100');
      commit(cell(1, 'New premium'), '110');

      dom.click('.xl-copy');
      await fixture.whenStable();

      expect(writeText).toHaveBeenCalledWith(
        'Old premium: $100\nNew premium: $110\n% Difference: 10.0%',
      );
      expect(dom.text('.xl-sheet > .result-secret-btn .result-secret-flag')).toBe('COPY ALL CAPS');

      dom.click('.xl-sheet > .result-secret-btn');
      await fixture.whenStable();

      expect(writeText).toHaveBeenLastCalledWith(
        'OLD PREMIUM: $100\nNEW PREMIUM: $110\n% DIFFERENCE: 10.0%',
      );
    });

    it('moves between cells with the arrow keys and stays put on Enter', () => {
      const press = (key: string): void => {
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        fixture.detectChanges();
      };
      cell(1, 'Old premium').focus();

      press('ArrowDown');
      expect(document.activeElement).toBe(cell(2, 'Old premium'));
      press('ArrowRight');
      expect(document.activeElement).toBe(cell(2, 'New premium'));
      press('ArrowRight');
      expect(document.activeElement).toBe(cell(2, 'Fixed fee'));
      press('ArrowRight');
      expect(document.activeElement).toBe(cell(2, 'Fixed fee'));
      press('ArrowUp');
      expect(document.activeElement).toBe(cell(1, 'Fixed fee'));
      press('ArrowLeft');
      press('ArrowLeft');
      expect(document.activeElement).toBe(cell(1, 'Old premium'));
      press('ArrowLeft');
      expect(document.activeElement).toBe(cell(1, 'Old premium'));
      press('ArrowUp');
      expect(document.activeElement).toBe(cell(1, 'Old premium'));

      cell(1, 'Old premium').value = '700';
      press('Enter');
      expect(cell(1, 'Old premium').value).toBe('700.00');
      expect(document.activeElement).toBe(cell(1, 'Old premium'));
    });

    it('keeps the caret inside a cell until it reaches the edge of the text', () => {
      const input = cell(1, 'New premium');
      input.value = '800';
      input.focus();
      input.setSelectionRange(1, 1);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(document.activeElement).toBe(input);

      input.setSelectionRange(0, 0);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(document.activeElement).toBe(cell(1, 'Old premium'));
    });

    it('clears every row with Clear all', () => {
      commit(cell(1, 'Old premium'), '100');
      commit(cell(1, 'New premium'), '110');
      commit(cell(8, 'Old premium'), '500');
      expect(rows().length).toBe(9);

      dom.click('.xl-bar .xl-btn:nth-of-type(2)');

      expect(rows().length).toBe(8);
      expect(cell(1, 'Old premium').value).toBe('');
      expect(cell(8, 'Old premium').value).toBe('');
      expect(outputs(1)).toEqual(['', '']);
      expect(dom.text('.xl-name')).toBe('Row 1 of 8');
    });

    it('adds another entry row once the last one is used', () => {
      commit(cell(8, 'Old premium'), '500');

      expect(rows().length).toBe(9);
    });

    it('keeps the rows and the form values while the other theme is showing', () => {
      commit(cell(1, 'Old premium'), '700');
      commit(cell(1, 'New premium'), '800');

      TestBed.inject(ThemeService).set('dark');
      fixture.detectChanges();
      dom.typeInto('#premOldInput', '1000');

      TestBed.inject(ThemeService).set('original');
      fixture.detectChanges();
      expect(outputs(1)).toEqual(['100.00', '+14.3%']);

      TestBed.inject(ThemeService).set('dark');
      fixture.detectChanges();
      expect(value('#premOldInput')).toBe('1000');
    });
  });
});
