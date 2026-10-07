import { findStateRule } from './state-rules';
import { YearsLicensedInput, calculateYearsLicensed, yearsLicensedRange } from './years-licensed';

const PERMIT_ONLY = "Learner's permit age only - not yet licensed";
const NO_PERMIT = "Not yet eligible for a learner's permit";

function calculate(code: string, input: Partial<Omit<YearsLicensedInput, 'rule'>>) {
  const rule = findStateRule(code);
  if (!rule) throw new Error(`Unknown state: ${code}`);
  return calculateYearsLicensed({
    rule,
    workup: new Date(2026, 0, 1),
    dob: null,
    issueDate: null,
    reportedAge: null,
    ...input,
  });
}

const bodyText = (result: ReturnType<typeof calculate>): string =>
  (result?.body ?? []).map((paragraph) => paragraph.map((part) => part.text).join('')).join('\n');

describe('calculateYearsLicensed', () => {
  describe('from date of birth', () => {
    it('uses the guideline permit age when checking Hawaii eligibility', () => {
      const result = calculate('HI', { dob: new Date(2010, 0, 1), workup: new Date(2025, 8, 1) });

      expect(result?.title).toBe(PERMIT_ONLY);
    });

    it('starts years licensed at the updated full license age', () => {
      // DOB 1/1/2010; license date is DOB + full license age
      const cases = [
        ['HI', new Date(2026, 0, 1), 'January 1, 2026'],
        ['ID', new Date(2025, 0, 1), 'January 1, 2025'],
        ['MD', new Date(2026, 6, 1), 'July 1, 2026'],
        ['NE', new Date(2026, 0, 1), 'January 1, 2026'],
        ['RI', new Date(2026, 6, 1), 'July 1, 2026'],
        ['SC', new Date(2025, 6, 1), 'July 1, 2025'],
      ] as const;

      for (const [state, licenseDate, label] of cases) {
        const dob = new Date(2010, 0, 1);

        const onLicenseDate = calculate(state, { dob, workup: licenseDate });
        expect(onLicenseDate?.title).toBe('Years licensed');
        expect(onLicenseDate?.meta).toContain(`License eligible from ${label}`);

        const dayBefore = new Date(licenseDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        expect(calculate(state, { dob, workup: dayBefore })?.title).not.toBe('Years licensed');
      }
    });

    it('counts years licensed from the updated Maryland license age', () => {
      const result = calculate('MD', { dob: new Date(2008, 0, 1), workup: new Date(2026, 0, 1) });

      // Licensed 7/1/2024 at 16½, so 1 yr 6 mo as of workup
      expect(result?.badge).toBe(yearsLicensedRange({ years: 1, months: 6, days: 0 }));
      expect(result?.badge).toBe('1 – 2 years');
    });

    it('uses the guideline license age when checking New York eligibility', () => {
      const result = calculate('NY', { dob: new Date(2009, 0, 1), workup: new Date(2026, 1, 1) });

      expect(result?.title).toBe('Years licensed');
    });

    it('does not treat South Dakota restricted-minor age as regular license age', () => {
      const result = calculate('SD', { dob: new Date(2010, 0, 1), workup: new Date(2025, 6, 2) });

      expect(result?.title).toBe(PERMIT_ONLY);
    });

    it('reports when the driver is too young for a permit, with the date they become eligible', () => {
      const result = calculate('TX', { dob: new Date(2012, 0, 1), workup: new Date(2025, 5, 1) });

      expect(result?.tone).toBe('danger');
      expect(result?.title).toBe(NO_PERMIT);
      expect(bodyText(result)).toBe(
        "As of the workup date, this driver has not yet reached the minimum age for a learner's permit in Texas.\nPermit eligible from: January 1, 2027",
      );
    });

    it('words the New Jersey permit messages with the state ages', () => {
      const dob = new Date(2010, 0, 1);

      expect(bodyText(calculate('NJ', { dob, workup: new Date(2026, 5, 1) }))).toBe(
        "As of the workup date, this driver is old enough for a learner's permit in New Jersey but has not yet reached the minimum license age (17).\nRegular license eligible from: January 1, 2027",
      );
      expect(bodyText(calculate('NJ', { dob, workup: new Date(2025, 5, 1) }))).toBe(
        'As of the workup date, this driver has not yet reached the minimum permit age in New Jersey (age 16).\nPermit eligible from: January 1, 2026',
      );
    });

    it('prepares range years clipboard text without the year label', () => {
      const result = calculate('TX', { dob: new Date(2000, 0, 1), workup: new Date(2017, 6, 1) });

      expect(result?.badge).toBe('1 – 2 years');
      expect(result?.copyText).toBe('1-2');
    });

    it('prepares exact years clipboard text as only the numeric value', () => {
      const result = calculate('MA', { dob: new Date(1990, 0, 1), workup: new Date(2024, 0, 1) });

      expect(result?.tileNum).toBe(17);
      expect(result?.tileLabel).toBe('years');
      expect(result?.copyText).toBe('17');
    });

    it('prepares New Jersey clipboard text with the month bracket intact', () => {
      // DOB 2000-01-01, workup 2017-03-01 → license-eligible 2017-01-01 → 2 months licensed
      const result = calculate('NJ', { dob: new Date(2000, 0, 1), workup: new Date(2017, 2, 1) });

      expect(result?.title).toBe('Months licensed');
      expect(result?.badge).toBe('0 – 6 months');
      expect(result?.copyText).toBe('0-6 months');
    });
  });

  describe('from the original issue date', () => {
    it('calculates years licensed from original issue date for a formerly excluded state', () => {
      const result = calculate('AL', {
        issueDate: new Date(2020, 0, 1),
        workup: new Date(2025, 0, 1),
      });

      expect(result?.title).toBe('Years licensed');
      expect(result?.meta).toContain('Based on original DL issue date: January 1, 2020');
    });

    it('rejects a workup date before the issue date', () => {
      const result = calculate('AL', {
        issueDate: new Date(2030, 0, 1),
        workup: new Date(2025, 0, 1),
      });

      expect(result?.tone).toBe('danger');
      expect(result?.title).toBe('Workup date is before the issue date');
    });
  });

  describe('from the age first licensed', () => {
    const dob = new Date(2000, 0, 1);
    const workup = new Date(2020, 0, 1);

    it('counts from the date the driver reached the reported age', () => {
      const result = calculate('TX', { dob, workup, reportedAge: 18 });

      expect(result?.badge).toBe('2 – 3 years');
      expect(result?.meta).toContain(
        'Based on reported first license age: 18 · Calculated license date: January 1, 2018',
      );
    });

    it('rejects a reported age inside the permit range or below it', () => {
      const permitOnly = calculate('TX', { dob, workup, reportedAge: 15.5 });
      expect(permitOnly?.title).toBe(PERMIT_ONLY);
      expect(bodyText(permitOnly)).toBe(
        "The entered age of 15.5 falls within the learner's permit range for Texas. The minimum license age is 16.\nYears licensed cannot be calculated from a permit-only age.",
      );

      const tooYoung = calculate('TX', { dob, workup, reportedAge: 14 });
      expect(tooYoung?.title).toBe(NO_PERMIT);
      expect(bodyText(tooYoung)).toBe(
        'The entered age of 14 is below the minimum permit age for Texas (age 15). Please verify the reported age.',
      );
    });

    it('warns when the driver had not reached the reported age by the workup date', () => {
      const result = calculate('TX', { dob, workup, reportedAge: 25 });

      expect(result?.title).toBe('Not yet licensed as of workup date');
      expect(bodyText(result)).toContain('License eligible from: January 1, 2025');
    });

    it('asks for the date of birth when it is missing', () => {
      expect(calculate('TX', { workup, reportedAge: 18 })?.title).toBe('Date of birth required');
    });
  });

  it('returns nothing when there is no date to count from', () => {
    expect(calculate('TX', {})).toBeNull();
  });
});
