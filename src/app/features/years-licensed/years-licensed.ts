import { CalcResult, plain, strong } from '../../shared/calc-result';
import { DateDiff, addMonths, dateDiff, formatLongDate } from '../../shared/date-utils';
import { StateRule, formatAge } from './state-rules';

export interface YearsLicensedInput {
  rule: StateRule;
  workup: Date;
  dob: Date | null;
  /** Original DL issue date from the MVR. When present it replaces the date of birth. */
  issueDate: Date | null;
  /** Age first licensed, as reported in a note or MVR. When present it replaces the state's license age. */
  reportedAge: number | null;
}

const PERMIT_ONLY_TITLE = "Learner's permit age only - not yet licensed";
const NO_PERMIT_TITLE = "Not yet eligible for a learner's permit";

export function calculateYearsLicensed(input: YearsLicensedInput): CalcResult | null {
  const { rule, workup, dob, issueDate, reportedAge } = input;

  if (issueDate) return fromIssueDate(rule, issueDate, workup);
  if (reportedAge !== null) return fromReportedAge(rule, dob, reportedAge, workup);
  if (dob) return fromDateOfBirth(rule, dob, workup);
  return null;
}

function fromIssueDate(rule: StateRule, issueDate: Date, workup: Date): CalcResult {
  if (workup < issueDate) {
    return {
      tone: 'danger',
      icon: 'x',
      title: 'Workup date is before the issue date',
      body: [
        [
          plain(
            `The workup date (${formatLongDate(workup)}) falls before the original DL issue date (${formatLongDate(issueDate)}). Please verify both dates.`,
          ),
        ],
      ],
    };
  }
  return licensedResult(
    rule,
    issueDate,
    workup,
    `Based on original DL issue date: ${formatLongDate(issueDate)}`,
  );
}

function fromReportedAge(
  rule: StateRule,
  dob: Date | null,
  reportedAge: number,
  workup: Date,
): CalcResult {
  const age = String(reportedAge);

  if (!dob) {
    return {
      tone: 'warn',
      icon: 'warn',
      title: 'Date of birth required',
      body: [
        [
          plain(
            "Please enter the driver's date of birth. It's needed to calculate years licensed from the reported age of ",
          ),
          strong(age),
          plain('.'),
        ],
      ],
    };
  }

  const reportedMonths = Math.round(reportedAge * 12);

  if (reportedMonths < rule.permitMonths) {
    return {
      tone: 'danger',
      icon: 'x',
      title: NO_PERMIT_TITLE,
      body: [
        [
          plain('The entered age of '),
          strong(age),
          plain(` is below the minimum permit age for ${rule.name} (age `),
          strong(formatAge(rule.permitMonths)),
          plain('). Please verify the reported age.'),
        ],
      ],
    };
  }

  if (reportedMonths < rule.licenseMonths) {
    return {
      tone: 'warn',
      icon: 'warn',
      title: PERMIT_ONLY_TITLE,
      body: [
        [
          plain('The entered age of '),
          strong(age),
          plain(
            ` falls within the learner's permit range for ${rule.name}. The minimum license age is `,
          ),
          strong(formatAge(rule.licenseMonths)),
          plain('.'),
        ],
        [plain('Years licensed cannot be calculated from a permit-only age.')],
      ],
    };
  }

  const licenseDate = addMonths(dob, reportedMonths);

  if (workup < licenseDate) {
    return {
      tone: 'warn',
      icon: 'warn',
      title: 'Not yet licensed as of workup date',
      body: [
        [
          plain(
            `Based on the reported license age of ${age}, this driver would not have been licensed until ${formatLongDate(licenseDate)}.`,
          ),
        ],
        [strong(`License eligible from: ${formatLongDate(licenseDate)}`)],
      ],
    };
  }

  return licensedResult(
    rule,
    licenseDate,
    workup,
    `Based on reported first license age: ${age} · Calculated license date: ${formatLongDate(licenseDate)}`,
  );
}

function fromDateOfBirth(rule: StateRule, dob: Date, workup: Date): CalcResult {
  const permitDate = addMonths(dob, rule.permitMonths);
  const licenseDate = addMonths(dob, rule.licenseMonths);
  const isNewJersey = rule.mode === 'months';

  if (workup >= licenseDate) {
    return licensedResult(
      rule,
      licenseDate,
      workup,
      `License eligible from ${formatLongDate(licenseDate)}`,
    );
  }

  if (workup >= permitDate) {
    const reason = isNewJersey
      ? `As of the workup date, this driver is old enough for a learner's permit in New Jersey but has not yet reached the minimum license age (${formatAge(rule.licenseMonths)}).`
      : `As of the workup date, this driver is old enough for a learner's permit in ${rule.name} but has not yet reached the minimum age for a regular license.`;
    return {
      tone: 'warn',
      icon: 'warn',
      title: PERMIT_ONLY_TITLE,
      body: [
        [plain(reason)],
        [strong(`Regular license eligible from: ${formatLongDate(licenseDate)}`)],
      ],
    };
  }

  const reason = isNewJersey
    ? `As of the workup date, this driver has not yet reached the minimum permit age in New Jersey (age ${formatAge(rule.permitMonths)}).`
    : `As of the workup date, this driver has not yet reached the minimum age for a learner's permit in ${rule.name}.`;
  return {
    tone: 'danger',
    icon: 'x',
    title: NO_PERMIT_TITLE,
    body: [[plain(reason)], [strong(`Permit eligible from: ${formatLongDate(permitDate)}`)]],
  };
}

/** The success result for a driver licensed since `start`, shaped by the state's output mode. */
function licensedResult(rule: StateRule, start: Date, workup: Date, basis: string): CalcResult {
  const diff = dateDiff(start, workup);
  const meta = `${basis} · ${diff.years} yr ${diff.months} mo ${diff.days} d as of workup date`;

  if (rule.mode === 'months') {
    const badge = monthsLicensedRange(diff);
    return {
      tone: 'success',
      icon: 'check',
      title: 'Months licensed',
      badge,
      copyText: monthsClipboardText(badge),
      meta,
    };
  }

  if (rule.mode === 'exact') {
    return {
      tone: 'success',
      icon: 'check',
      title: 'Years licensed',
      tileNum: diff.years,
      tileLabel: diff.years === 1 ? 'year' : 'years',
      copyText: String(diff.years),
      meta,
    };
  }

  const badge = yearsLicensedRange(diff);
  return {
    tone: 'success',
    icon: 'check',
    title: 'Years licensed',
    badge,
    copyText: rangeClipboardText(badge),
    meta,
  };
}

export function yearsLicensedRange(diff: DateDiff): string {
  const months = diff.years * 12 + diff.months;
  if (months < 12) return 'Less than 1 year';
  if (months < 24) return '1 – 2 years';
  if (months < 36) return '2 – 3 years';
  return 'More than 3 years';
}

export function monthsLicensedRange(diff: DateDiff): string {
  const months = diff.years * 12 + diff.months;
  if (months < 6) return '0 – 6 months';
  if (months < 12) return '7 – 12 months';
  if (months < 18) return '13 – 18 months';
  if (months < 24) return '19 – 24 months';
  if (months < 30) return '25 – 30 months';
  if (months < 36) return '31 – 35 months';
  return 'More than 36 months';
}

/** "1 – 2 years" -> "1-2" */
function rangeClipboardText(label: string): string {
  return label
    .replace(/\s*[–-]\s*/g, '-')
    .replace(/\s+years?$/i, '')
    .toLowerCase();
}

/** "0 – 6 months" -> "0-6 months" */
function monthsClipboardText(label: string): string {
  return label.replace(/\s*[–-]\s*/g, '-');
}
