import { ComponentFixture, TestBed } from '@angular/core/testing';

import { App } from './app';

function installStorageMock(): void {
  const storage = new Map<string, string>();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  });
}

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;

  beforeEach(async () => {
    installStorageMock();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('renders both calculator headings', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Years Licensed Calculator');
    expect(compiled.textContent).toContain('Premium Workup Calculator');
  });

  it('aligns previously divergent state ages with the AP guideline table', () => {
    const guidelineRules = [
      ['CT', { pM: 192, lM: 192, pL: '16', lL: '16' }],
      ['DE', { pM: 190, lM: 192, pL: '15y10m', lL: '16' }],
      ['DC', { pM: 192, lM: 204, pL: '16', lL: '17' }],
      ['HI', { pM: 186, lM: 204, pL: '15½', lL: '17' }],
      ['ID', { pM: 180, lM: 216, pL: '15', lL: '18' }],
      ['KY', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['LA', { pM: 180, lM: 204, pL: '15', lL: '17' }],
      ['MD', { pM: 189, lM: 216, pL: '15y9m', lL: '18' }],
      ['MS', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['MT', { pM: 174, lM: 180, pL: '14½', lL: '15' }],
      ['NE', { pM: 180, lM: 204, pL: '15', lL: '17' }],
      ['NM', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['NY', { pM: 192, lM: 204, pL: '16', lL: '17' }],
      ['RI', { pM: 192, lM: 204, pL: '16', lL: '17' }],
      ['SC', { pM: 180, lM: 204, pL: '15', lL: '17' }],
      ['SD', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['WA', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['WI', { pM: 180, lM: 192, pL: '15', lL: '16' }],
    ] as const;

    for (const [state, expected] of guidelineRules) {
      expect(component.stateData[state]).toEqual(expected);
    }
  });

  it('uses the guideline permit age when checking Hawaii eligibility', () => {
    component.selectedState = 'HI';
    component.parsedDob = new Date(2010, 0, 1);
    component.parsedWorkup = new Date(2026, 0, 1);

    component.calculateYears();

    expect(component.yearsResult?.title).toBe("Learner's permit age only - not yet licensed");
  });

  it('uses the guideline license age when checking New York eligibility', () => {
    component.selectedState = 'NY';
    component.parsedDob = new Date(2009, 0, 1);
    component.parsedWorkup = new Date(2026, 1, 1);

    component.calculateYears();

    expect(component.yearsResult?.title).toBe('Years licensed');
  });

  it('does not treat South Dakota restricted-minor age as regular license age', () => {
    component.selectedState = 'SD';
    component.parsedDob = new Date(2010, 0, 1);
    component.parsedWorkup = new Date(2025, 6, 2);

    component.calculateYears();

    expect(component.yearsResult?.title).toBe("Learner's permit age only - not yet licensed");
  });

  it('shows the original issue date override by default without a state selected', () => {
    fixture.detectChanges();

    expect(component.canShowIssueDateOverride).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Original DL Issue Date');
  });

  it('calculates years licensed from original issue date for a formerly excluded state', () => {
    component.selectedState = 'AL';
    component.expMvrEnabled = true;
    component.parsedIssueDate = new Date(2020, 0, 1);
    component.parsedWorkup = new Date(2025, 0, 1);

    component.calculateYears();

    expect(component.yearsResult?.title).toBe('Years licensed');
    expect(component.yearsResult?.meta).toContain('Based on original DL issue date: January 1, 2020');
  });

  it('allows selected date digits to be replaced when the date already has eight digits', () => {
    const input = document.createElement('input');
    input.value = '01/23/4567';
    input.setSelectionRange(0, 2);
    const event = new KeyboardEvent('keydown', { key: '9', cancelable: true });
    Object.defineProperty(event, 'target', { value: input });

    component.guardDateKey(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('deletes the previous digit in one backspace when the cursor is after a slash', () => {
    const input = document.createElement('input');
    input.id = 'dobInput';
    input.value = '02/14/1999';
    input.setSelectionRange(6, 6);
    const backspace = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });
    Object.defineProperty(backspace, 'target', { value: input });

    component.guardDateKey(backspace);

    expect(backspace.defaultPrevented).toBe(true);
    expect(component.primaryDateInput).toBe('02/1/1999');
    expect(input.selectionStart).toBe(4);
    expect(input.selectionEnd).toBe(4);
  });

  it('deletes the next digit in one delete when the cursor is on a slash', () => {
    const input = document.createElement('input');
    input.id = 'dobInput';
    input.value = '02/14/1999';
    input.setSelectionRange(5, 5);
    const deleteKey = new KeyboardEvent('keydown', { key: 'Delete', cancelable: true });
    Object.defineProperty(deleteKey, 'target', { value: input });

    component.guardDateKey(deleteKey);

    expect(deleteKey.defaultPrevented).toBe(true);
    expect(component.primaryDateInput).toBe('02/14/999');
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
  });

  it('preserves the cursor position after date input is reformatted', () => {
    const input = document.createElement('input');
    input.id = 'dobInput';
    input.value = '02/1/1999';
    input.setSelectionRange(4, 4);

    component.onPrimaryDateInput(input);

    expect(component.primaryDateInput).toBe('02/1/1999');
    expect(input.selectionStart).toBe(4);
    expect(input.selectionEnd).toBe(4);
  });

  it('formats date input with protected separators without clamping mid-edit', () => {
    expect(component.formatDateInput('')).toBe('');
    expect(component.formatDateInput('1')).toBe('1');
    expect(component.formatDateInput('13')).toBe('13/');
    expect(component.formatDateInput('123')).toBe('12/3');
    expect(component.formatDateInput('1232')).toBe('12/32/');
    expect(component.formatDateInput('12/31/2026')).toBe('12/31/2026');
  });

  it('spills pasted overflow digits forward into later segments', () => {
    expect(component.formatDateInput('07/152026')).toBe('07/15/2026');
  });

  it('allows editing a day segment down without snapping to the max mid-edit', () => {
    const input = document.createElement('input');
    input.id = 'dobInput';
    input.value = '07/5/2026';
    input.setSelectionRange(4, 4);

    component.onPrimaryDateInput(input);

    expect(component.primaryDateInput).toBe('07/5/2026');
  });

  it('lets a corrected day digit slot back in without corrupting the year (07/05/2026 -> 07/15/2026)', () => {
    const input = document.createElement('input');
    input.id = 'dobInput';
    input.value = '07/5/2026';
    input.setSelectionRange(4, 4);

    component.onPrimaryDateInput(input);
    expect(component.primaryDateInput).toBe('07/5/2026');

    input.value = '07/15/2026';
    input.setSelectionRange(5, 5);
    component.onPrimaryDateInput(input);

    expect(component.primaryDateInput).toBe('07/15/2026');
  });

  it('keeps date rollover behavior after masked date input is applied', () => {
    const input = document.createElement('input');
    input.id = 'dobInput';
    input.value = '06/31/2026';

    component.onPrimaryDateInput(input);

    expect(component.primaryDateInput).toBe('06/31/2026');

    component.applyPrimaryDateInput();

    expect(component.primaryDateInput).toBe('07/01/2026');
  });

  it('prepares range years clipboard text without the year label', () => {
    component.selectedState = 'TX';
    component.parsedDob = new Date(2000, 0, 1);
    component.parsedWorkup = new Date(2017, 6, 1);

    component.calculateYears();

    expect(component.yearsResult?.badge).toBe('1 – 2 years');
    expect(component.yearsResult?.copyText).toBe('1-2');
  });

  it('prepares exact years clipboard text as only the numeric value', () => {
    component.selectedState = 'MA';
    component.parsedDob = new Date(1990, 0, 1);
    component.parsedWorkup = new Date(2024, 0, 1);

    component.calculateYears();

    expect(component.yearsResult?.tileNum).toBe(17);
    expect(component.yearsResult?.copyText).toBe('17');
  });

  it('prepares New Jersey clipboard text with the month bracket intact', () => {
    component.selectedState = 'NJ';
    // DOB 2000-01-01, workup 2017-03-01 → license-eligible 2017-01-01 → 2 months licensed
    component.parsedDob = new Date(2000, 0, 1);
    component.parsedWorkup = new Date(2017, 2, 1);

    component.calculateYears();

    expect(component.yearsResult?.badge).toBe('0 – 6 months');
    expect(component.yearsResult?.copyText).toBe('0-6 months');
  });

  it('enables premium calculation only when both premium values are parsed', () => {
    expect(component.premiumReady).toBe(false);

    component.parsedOldPrem = 1000;
    expect(component.premiumReady).toBe(false);

    component.parsedNewPrem = 1200;
    expect(component.premiumReady).toBe(true);
  });

  it('calculates a premium increase percentage', () => {
    component.parsedOldPrem = 1000;
    component.parsedNewPrem = 1125;

    component.calculatePremium();

    expect(component.premResult?.title).toBe('Premium increase');
    expect(component.premResult?.premiumPct).toBe('+12.5%');
    expect(component.premResult?.premiumClass).toBe('increase');
  });

  it('includes a fee left in the input field even if "Add fee" was never clicked', () => {
    component.origOldPrem = 100;
    component.origNewPrem = 200;
    component.syncAdjustedPremiums();
    component.onFeeInput('5');

    component.calculatePremium();

    expect(component.fixedFees).toEqual([5]);
    expect(component.premResult?.premiumPct).toBe('+105.3%');
  });

  it('includes both an already-added fee and a still-pending typed fee on calculate', () => {
    component.origOldPrem = 100;
    component.origNewPrem = 200;
    component.syncAdjustedPremiums();
    component.onFeeInput('5');
    component.addFixedFee();
    component.onFeeInput('1');

    component.calculatePremium();

    expect(component.fixedFees).toEqual([5, 1]);
    expect(component.parsedOldPrem).toBe(94);
    expect(component.parsedNewPrem).toBe(194);
    expect(component.premResult?.premiumPct).toBe('+106.4%');
  });

  it('shows copied feedback immediately without waiting for clipboard', () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => window.setTimeout(resolve, 100)),
    );
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    component.copyResult('17', { currentTarget: { blur: vi.fn() } } as unknown as Event);

    expect(component.copiedText()).toBe('17');
    expect(writeText).toHaveBeenCalledWith('17');

    vi.advanceTimersByTime(2000);
    expect(component.copiedText()).toBe('');

    vi.useRealTimers();
  });

  it('prepares premium clipboard text as labeled rows', () => {
    component.parsedOldPrem = 100;
    component.parsedNewPrem = 200;

    component.calculatePremium();

    expect(component.premResult?.copyText).toBe('Old premium: $100\nNew premium: $200\n% Difference: 100.0%');
  });

  it('omits copy text for premium decrease and no change', () => {
    component.parsedOldPrem = 100;
    component.parsedNewPrem = 80;
    component.calculatePremium();
    expect(component.premResult?.copyText).toBeUndefined();

    component.parsedNewPrem = 100;
    component.calculatePremium();
    expect(component.premResult?.tone).toBe('warn');
    expect(component.premResult?.copyText).toBeUndefined();
  });

  it('sanitizes pasted premium input to numeric characters only', () => {
    const input = document.createElement('input');
    input.id = 'premOldInput';
    input.value = '10';
    input.setSelectionRange(2, 2);

    component.guardDecimalPaste({
      preventDefault: vi.fn(),
      clipboardData: { getData: () => '$1a2.3b4' },
      target: input,
    } as unknown as ClipboardEvent);

    expect(input.value).toBe('1012.34');
    expect(component.premOldInput).toBe('1012.34');
  });

  it('clears premium values and result state', () => {
    component.premOldInput = '1,000.00';
    component.premNewInput = '1,125.00';
    component.premFeeInput = '25.00';
    component.parsedOldPrem = 1000;
    component.parsedNewPrem = 1125;
    component.fixedFees = [25];
    component.calculatePremium();

    component.clearPremium();

    expect(component.premOldInput).toBe('');
    expect(component.premNewInput).toBe('');
    expect(component.premFeeInput).toBe('');
    expect(component.parsedOldPrem).toBeNull();
    expect(component.parsedNewPrem).toBeNull();
    expect(component.fixedFees).toEqual([]);
    expect(component.premResult).toBeNull();
  });

  describe('template interactions', () => {
    let root: HTMLElement;

    const query = <T extends HTMLElement>(selector: string): T | null => root.querySelector<T>(selector);
    const get = <T extends HTMLElement>(selector: string): T => {
      const el = query<T>(selector);
      if (!el) throw new Error(`Missing element: ${selector}`);
      return el;
    };
    const text = (selector: string): string => get(selector).textContent?.trim() ?? '';

    function click(selector: string): void {
      get(selector).click();
      fixture.detectChanges();
    }

    function typeInto(selector: string, value: string): void {
      const input = get<HTMLInputElement>(selector);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    function selectState(code: string): void {
      const select = get<HTMLSelectElement>('#stateSelect');
      select.value = code;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    function clickCalendarDay(day: number): void {
      const button = Array.from(root.querySelectorAll<HTMLButtonElement>('button.cal-day')).find(
        (el) => el.textContent?.trim() === String(day),
      );
      if (!button) throw new Error(`Missing calendar day: ${day}`);
      button.click();
      fixture.detectChanges();
    }

    function mockClipboard() {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
      return writeText;
    }

    const primaryCalendarBtn = '.field:has(#dobInput) .cal-icon-btn';
    const workupCalendarBtn = '.field:has(#workupInput) .cal-icon-btn';
    const mvrToggle = '#mvrPanel input[type="checkbox"]';
    const ageToggle = '#agePanel input[type="checkbox"]';
    const yearsCalculateBtn = '.years-card .btn';

    beforeEach(() => {
      fixture.detectChanges();
      root = fixture.nativeElement as HTMLElement;
    });

    it('opens the calendar on the typed date and fills the date of birth from a picked day', () => {
      typeInto('#dobInput', '03/15/2021');
      expect(query('#calPopup')).toBeNull();

      click(primaryCalendarBtn);

      expect(text('.cal-month-label')).toBe('March 2021');
      expect(root.querySelectorAll('.cal-day.empty').length).toBe(1);
      expect(root.querySelectorAll('button.cal-day').length).toBe(31);
      expect(text('.cal-day.selected')).toBe('15');

      clickCalendarDay(20);

      expect(query('#calPopup')).toBeNull();
      expect(component.primaryDateInput).toBe('03/20/2021');
      expect(component.parsedDob?.getDate()).toBe(20);
      expect(get<HTMLInputElement>('#dobInput').value).toBe('03/20/2021');
    });

    it('navigates calendar months and years, wrapping across year boundaries', () => {
      typeInto('#workupInput', '12/10/2025');
      click(workupCalendarBtn);
      expect(text('.cal-month-label')).toBe('December 2025');

      click('.cal-nav[title="Next month"]');
      expect(text('.cal-month-label')).toBe('January 2026');

      click('.cal-nav[title="Previous month"]');
      expect(text('.cal-month-label')).toBe('December 2025');

      click('.cal-nav[title="Next year"]');
      expect(text('.cal-month-label')).toBe('December 2026');

      click('.cal-nav[title="Previous year"]');
      expect(text('.cal-month-label')).toBe('December 2025');

      clickCalendarDay(25);

      expect(component.workupInput).toBe('12/25/2025');
      expect(component.parsedWorkup?.getDate()).toBe(25);
      expect(get<HTMLInputElement>('#workupInput').value).toBe('12/25/2025');
    });

    it('defaults an empty calendar to the current month and highlights today', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 4, 15, 12));

      click(primaryCalendarBtn);

      expect(text('.cal-month-label')).toBe('May 2026');
      expect(root.querySelectorAll('.cal-day.empty').length).toBe(5);
      expect(text('.cal-day.today')).toBe('15');
      expect(query('.cal-day.selected')).toBeNull();

      vi.useRealTimers();
    });

    it('closes the calendar when its icon is clicked again or the pointer goes down outside it', () => {
      click(primaryCalendarBtn);
      expect(query('#calPopup')).not.toBeNull();

      click(primaryCalendarBtn);
      expect(query('#calPopup')).toBeNull();

      click(primaryCalendarBtn);
      get('.cal-month-label').dispatchEvent(new Event('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(query('#calPopup')).not.toBeNull();

      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(query('#calPopup')).toBeNull();
    });

    it('adds a fixed fee pill and removes it again, restoring the original premiums', () => {
      typeInto('#premOldInput', '1000');
      typeInto('#premNewInput', '1200');
      typeInto('#premFeeInput', '25');
      expect(query('.prem-orig-ref')).toBeNull();

      click('.fee-add-btn');

      expect(text('.fee-pill')).toContain('$25.00');
      expect(get('.fee-remove-btn').getAttribute('aria-label')).toBe('Remove $25.00 fixed fee');
      expect(text('.prem-orig-ref')).toContain('Fixed fees: $25.00');
      expect(get<HTMLInputElement>('#premOldInput').value).toBe('975.00');
      expect(get<HTMLInputElement>('#premNewInput').value).toBe('1,175.00');
      expect(get<HTMLInputElement>('#premFeeInput').value).toBe('');

      click('.fee-remove-btn');

      expect(query('.fee-pill')).toBeNull();
      expect(query('.prem-orig-ref')).toBeNull();
      expect(get<HTMLInputElement>('#premOldInput').value).toBe('1,000.00');
      expect(get<HTMLInputElement>('#premNewInput').value).toBe('1,200.00');
    });

    it('adds a fixed fee when Enter is pressed in the fee field', () => {
      typeInto('#premFeeInput', '12.5');

      get('#premFeeInput').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();

      expect(component.fixedFees).toEqual([12.5]);
      expect(text('.fee-pill')).toContain('$12.50');
    });

    it('shows a warning card instead of adding a fee that exceeds the premium', () => {
      typeInto('#premOldInput', '100');
      typeInto('#premNewInput', '200');
      typeInto('#premFeeInput', '150');

      click('.fee-add-btn');

      expect(query('.fee-pill')).toBeNull();
      expect(get('.result').classList.contains('warn')).toBe(true);
      expect(text('.result-title')).toBe('Fixed fee exceeds premium');
      expect(text('.result-body')).toContain('Adding a fee of $150.00');
      expect(query('.result-copy-btn')).toBeNull();
    });

    it('shows the selected state rule and switches the primary date between DOB and issue date', () => {
      selectState('TX');
      expect(text('.state-info')).toContain('Texas');
      expect(text('.state-info')).toContain('Range output');

      typeInto('#dobInput', '01/01/2000');
      click(mvrToggle);

      expect(text('label[for="dobInput"]')).toBe('Original DL Issue Date');
      expect(get<HTMLInputElement>('#dobInput').value).toBe('');
      expect(get('#agePanel').classList.contains('panel-disabled')).toBe(true);

      click(mvrToggle);

      expect(text('label[for="dobInput"]')).toBe("Driver's Date of Birth");
      expect(get<HTMLInputElement>('#dobInput').value).toBe('01/01/2000');
      expect(get('#agePanel').classList.contains('panel-disabled')).toBe(false);
    });

    it('turns the issue date override off when the age override is enabled', () => {
      typeInto('#dobInput', '01/01/2000');
      click(mvrToggle);

      click(ageToggle);

      expect(component.expMvrEnabled).toBe(false);
      expect(get<HTMLInputElement>(mvrToggle).checked).toBe(false);
      expect(get('#mvrPanel').classList.contains('panel-disabled')).toBe(true);
      expect(get<HTMLInputElement>('#dobInput').value).toBe('01/01/2000');
      expect(query('#ageInput')).not.toBeNull();
    });

    it('calculates from the age first licensed entered in the override field', () => {
      selectState('TX');
      typeInto('#dobInput', '01/01/2000');
      typeInto('#workupInput', '01/01/2020');
      expect(query('#ageInput')).toBeNull();

      click(ageToggle);
      expect(get(yearsCalculateBtn).getAttribute('aria-disabled')).toBe('true');

      typeInto('#ageInput', '18');
      expect(get(yearsCalculateBtn).getAttribute('aria-disabled')).toBe('false');

      click(yearsCalculateBtn);

      expect(get('.result').classList.contains('success')).toBe(true);
      expect(text('.range-badge')).toBe('2 – 3 years');
      expect(text('.meta')).toContain('Based on reported first license age: 18');

      typeInto('#ageInput', '15.5');
      expect(query('.result')).toBeNull();

      click(yearsCalculateBtn);

      expect(get('.result').classList.contains('warn')).toBe(true);
      expect(text('.result-title')).toBe("Learner's permit age only - not yet licensed");
      expect(text('.result-body')).toContain('permit range for Texas');

      click(ageToggle);

      expect(query('#ageInput')).toBeNull();
      expect(component.expAgeValue).toBeNull();
      expect(query('.result')).toBeNull();
    });

    it('copies the result text and the all-caps variant from their buttons', () => {
      vi.useFakeTimers();
      const writeText = mockClipboard();
      const copyText = 'Old premium: $100\nNew premium: $200\n% Difference: 100.0%';
      typeInto('#premOldInput', '100');
      typeInto('#premNewInput', '200');
      click('.premium-card .btn');

      click('.result-copy-btn');

      expect(writeText).toHaveBeenCalledWith(copyText);
      expect(get('.result-copy-btn').classList.contains('copied')).toBe(true);
      expect(get('.result-copy-btn').getAttribute('aria-label')).toBe('Copied');
      expect(get('.result-secret-btn').getAttribute('aria-label')).toBe('Copy');

      click('.result-secret-btn');

      expect(writeText).toHaveBeenLastCalledWith(copyText.toUpperCase());
      expect(get('.result-secret-btn').classList.contains('copied')).toBe(true);
      expect(get('.result-copy-btn').classList.contains('copied')).toBe(false);

      vi.advanceTimersByTime(2000);
      fixture.detectChanges();

      expect(get('.result-secret-btn').getAttribute('aria-label')).toBe('Copy');

      vi.useRealTimers();
    });

    it('offers the all-caps copy button only on the premium result', () => {
      selectState('MA');
      typeInto('#dobInput', '01/01/1990');
      typeInto('#workupInput', '01/01/2024');
      click(yearsCalculateBtn);

      expect(text('.tile-num')).toBe('17');
      expect(text('.tile-lbl')).toBe('years');
      expect(root.querySelectorAll('.result-copy-btn').length).toBe(1);
      expect(query('.result-secret-btn')).toBeNull();

      typeInto('#premOldInput', '100');
      typeInto('#premNewInput', '80');
      click('.premium-card .btn');

      expect(text('.prem-pct')).toBe('-20.0%');
      expect(get('.prem-pct').classList.contains('decrease')).toBe(true);
      expect(root.querySelectorAll('.result-copy-btn').length).toBe(1);
      expect(query('.result-secret-btn')).toBeNull();
    });
  });
});
