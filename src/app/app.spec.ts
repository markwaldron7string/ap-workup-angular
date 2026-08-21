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

    expect(compiled.textContent).toContain('YEARS LICENSED CALCULATOR');
    expect(compiled.textContent).toContain('PREMIUM WORKUP CALCULATOR');
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
    // DOB 2000-01-01, workup 2018-03-01 → license-eligible 2018-01-01 → 2 months licensed
    component.parsedDob = new Date(2000, 0, 1);
    component.parsedWorkup = new Date(2018, 2, 1);

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
});
