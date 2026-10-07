import { ComponentFixture, TestBed } from '@angular/core/testing';
import { domOf } from '../../../testing/dom';
import { YearsLicensedCalculator } from './years-licensed-calculator';

describe('YearsLicensedCalculator', () => {
  let fixture: ComponentFixture<YearsLicensedCalculator>;
  let component: YearsLicensedCalculator;
  let dom: ReturnType<typeof domOf<YearsLicensedCalculator>>;

  const primaryCalendarBtn = '.field:has(#dobInput) .cal-icon-btn';
  const workupCalendarBtn = '.field:has(#workupInput) .cal-icon-btn';
  const mvrToggle = '#mvrPanel input[type="checkbox"]';
  const ageToggle = '#agePanel input[type="checkbox"]';
  const calculateBtn = '.years-card .btn';

  const value = (selector: string): string => dom.get<HTMLInputElement>(selector).value;

  function clickCalendarDay(day: number): void {
    const button = dom
      .all<HTMLButtonElement>('button.cal-day')
      .find((el) => el.textContent?.trim() === String(day));
    if (!button) throw new Error(`Missing calendar day: ${day}`);
    button.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(YearsLicensedCalculator);
    component = fixture.componentInstance;
    fixture.detectChanges();
    dom = domOf(fixture);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists the states in their three groups', () => {
    const groups = dom.all<HTMLOptGroupElement>('#stateSelect optgroup');

    expect(groups.map((group) => group.querySelectorAll('option').length)).toEqual([3, 1, 47]);
    expect(groups[0].textContent).toContain('MA - Massachusetts');
    expect(groups[2].querySelector('option')?.textContent?.trim()).toBe('AK - Alaska');
  });

  it('shows the original issue date override by default without a state selected', () => {
    expect(dom.text('#mvrPanel .exp-title')).toBe('Original DL Issue Date');
    expect(dom.query(mvrToggle)).not.toBeNull();
  });

  it('enables Calculate only once the state and both dates are in', () => {
    const disabled = () => dom.get(calculateBtn).getAttribute('aria-disabled');
    expect(disabled()).toBe('true');

    dom.select('#stateSelect', 'TX');
    dom.typeInto('#dobInput', '01/01/2000');
    expect(disabled()).toBe('true');

    dom.typeInto('#workupInput', '01/01/202');
    expect(disabled()).toBe('true');

    dom.typeInto('#workupInput', '01/01/2020');
    expect(disabled()).toBe('false');
  });

  it('calculates from the date of birth and clears the result when an input changes', () => {
    dom.select('#stateSelect', 'TX');
    dom.typeInto('#dobInput', '01/01/2000');
    dom.typeInto('#workupInput', '07/01/2017');

    dom.click(calculateBtn);

    expect(dom.get('.result').classList.contains('success')).toBe(true);
    expect(dom.text('.range-badge')).toBe('1 – 2 years');
    expect(component.result()?.copyText).toBe('1-2');

    dom.typeInto('#workupInput', '07/01/2018');
    expect(dom.query('.result')).toBeNull();
  });

  it('clears every field and the result', () => {
    dom.select('#stateSelect', 'TX');
    dom.typeInto('#dobInput', '01/01/2000');
    dom.typeInto('#workupInput', '07/01/2017');
    dom.click(ageToggle);
    dom.typeInto('#ageInput', '18');
    dom.click(calculateBtn);

    dom.click('.years-card .btn-clear');

    expect(value('#stateSelect')).toBe('');
    expect(value('#dobInput')).toBe('');
    expect(value('#workupInput')).toBe('');
    expect(dom.query('#ageInput')).toBeNull();
    expect(dom.query('.state-info')).toBeNull();
    expect(dom.query('.result')).toBeNull();
  });

  describe('calendar', () => {
    it('opens the calendar on the typed date and fills the date of birth from a picked day', () => {
      dom.typeInto('#dobInput', '03/15/2021');
      expect(dom.query('#calPopup')).toBeNull();

      dom.click(primaryCalendarBtn);

      expect(dom.text('.cal-month-label')).toBe('March 2021');
      expect(dom.all('.cal-day.empty').length).toBe(1);
      expect(dom.all('button.cal-day').length).toBe(31);
      expect(dom.text('.cal-day.selected')).toBe('15');

      clickCalendarDay(20);

      expect(dom.query('#calPopup')).toBeNull();
      expect(value('#dobInput')).toBe('03/20/2021');
    });

    it('navigates calendar months and years, wrapping across year boundaries', () => {
      dom.typeInto('#workupInput', '12/10/2025');
      dom.click(workupCalendarBtn);
      expect(dom.text('.cal-month-label')).toBe('December 2025');

      dom.click('.cal-nav[title="Next month"]');
      expect(dom.text('.cal-month-label')).toBe('January 2026');

      dom.click('.cal-nav[title="Previous month"]');
      expect(dom.text('.cal-month-label')).toBe('December 2025');

      dom.click('.cal-nav[title="Next year"]');
      expect(dom.text('.cal-month-label')).toBe('December 2026');

      dom.click('.cal-nav[title="Previous year"]');
      expect(dom.text('.cal-month-label')).toBe('December 2025');

      clickCalendarDay(25);

      expect(value('#workupInput')).toBe('12/25/2025');
    });

    it('defaults an empty calendar to the current month and highlights today', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 4, 15, 12));

      dom.click(primaryCalendarBtn);

      expect(dom.text('.cal-month-label')).toBe('May 2026');
      expect(dom.all('.cal-day.empty').length).toBe(5);
      expect(dom.text('.cal-day.today')).toBe('15');
      expect(dom.query('.cal-day.selected')).toBeNull();
    });

    it('closes the calendar when its icon is clicked again or the pointer goes down outside it', () => {
      dom.click(primaryCalendarBtn);
      expect(dom.query('#calPopup')).not.toBeNull();

      dom.click(primaryCalendarBtn);
      expect(dom.query('#calPopup')).toBeNull();

      dom.click(primaryCalendarBtn);
      dom.get('.cal-month-label').dispatchEvent(new Event('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(dom.query('#calPopup')).not.toBeNull();

      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(dom.query('#calPopup')).toBeNull();
    });

    it('moves the calendar to the other date field when its icon is used', () => {
      dom.typeInto('#dobInput', '03/15/2021');
      dom.typeInto('#workupInput', '12/10/2025');
      dom.click(primaryCalendarBtn);

      dom.get(workupCalendarBtn).dispatchEvent(new Event('pointerdown', { bubbles: true }));
      dom.click(workupCalendarBtn);

      expect(dom.all('#calPopup').length).toBe(1);
      expect(dom.text('.cal-month-label')).toBe('December 2025');
    });
  });

  describe('overrides', () => {
    it('shows the selected state rule and switches the primary date between DOB and issue date', () => {
      dom.select('#stateSelect', 'TX');
      expect(dom.text('.state-info')).toContain('Texas');
      expect(dom.text('.state-info')).toContain('Range output');

      dom.typeInto('#dobInput', '01/01/2000');
      dom.click(mvrToggle);

      expect(dom.text('label[for="dobInput"]')).toBe('Original DL Issue Date');
      expect(value('#dobInput')).toBe('');
      expect(dom.get('#agePanel').classList.contains('panel-disabled')).toBe(true);

      dom.click(mvrToggle);

      expect(dom.text('label[for="dobInput"]')).toBe("Driver's Date of Birth");
      expect(value('#dobInput')).toBe('01/01/2000');
      expect(dom.get('#agePanel').classList.contains('panel-disabled')).toBe(false);
    });

    it('calculates from the original issue date in place of the date of birth', () => {
      dom.select('#stateSelect', 'AL');
      dom.typeInto('#workupInput', '01/01/2025');
      dom.click(mvrToggle);
      dom.typeInto('#dobInput', '01/01/2020');

      dom.click(calculateBtn);

      expect(dom.text('.result-title')).toBe('Years licensed');
      expect(dom.text('.meta')).toContain('Based on original DL issue date: January 1, 2020');
    });

    it('turns the issue date override off when the age override is enabled', () => {
      dom.typeInto('#dobInput', '01/01/2000');
      dom.click(mvrToggle);

      dom.click(ageToggle);

      expect(dom.get<HTMLInputElement>(mvrToggle).checked).toBe(false);
      expect(dom.get('#mvrPanel').classList.contains('panel-disabled')).toBe(true);
      expect(value('#dobInput')).toBe('01/01/2000');
      expect(dom.query('#ageInput')).not.toBeNull();
    });

    it('calculates from the age first licensed entered in the override field', () => {
      dom.select('#stateSelect', 'TX');
      dom.typeInto('#dobInput', '01/01/2000');
      dom.typeInto('#workupInput', '01/01/2020');
      expect(dom.query('#ageInput')).toBeNull();

      dom.click(ageToggle);
      expect(component.ageEnabled()).toBe(true);
      expect(dom.get(calculateBtn).getAttribute('aria-disabled')).toBe('true');

      dom.typeInto('#ageInput', '18');
      expect(dom.get(calculateBtn).getAttribute('aria-disabled')).toBe('false');

      dom.click(calculateBtn);

      expect(dom.get('.result').classList.contains('success')).toBe(true);
      expect(dom.text('.range-badge')).toBe('2 – 3 years');
      expect(dom.text('.meta')).toContain('Based on reported first license age: 18');

      dom.typeInto('#ageInput', '15.5');
      expect(dom.query('.result')).toBeNull();

      dom.click(calculateBtn);

      expect(dom.get('.result').classList.contains('warn')).toBe(true);
      expect(dom.text('.result-title')).toBe("Learner's permit age only - not yet licensed");
      expect(dom.text('.result-body')).toBe(
        "The entered age of 15.5 falls within the learner's permit range for Texas. The minimum license age is 16.Years licensed cannot be calculated from a permit-only age.",
      );
      expect(dom.all('.result-body strong').map((el) => el.textContent)).toEqual(['15.5', '16']);
      expect(dom.all('.result-body br').length).toBe(2);

      dom.click(ageToggle);

      expect(dom.query('#ageInput')).toBeNull();
      expect(dom.query('.result')).toBeNull();
      expect(dom.get(calculateBtn).getAttribute('aria-disabled')).toBe('false');
    });
  });
});
