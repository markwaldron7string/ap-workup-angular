/**
 * How a state's result is reported:
 * - exact: a whole number of years
 * - months: New Jersey's month brackets
 * - range: a year bracket such as "1 – 2 years"
 */
export type OutputMode = 'exact' | 'months' | 'range';

export interface StateRule {
  code: string;
  name: string;
  /** Minimum learner's permit age, in months. */
  permitMonths: number;
  /** Minimum regular license age, in months. */
  licenseMonths: number;
  mode: OutputMode;
}

function rule(
  code: string,
  name: string,
  permitMonths: number,
  licenseMonths: number,
  mode: OutputMode = 'range',
): StateRule {
  return { code, name, permitMonths, licenseMonths, mode };
}

export const STATE_RULES: readonly StateRule[] = [
  rule('MA', 'Massachusetts', 192, 198, 'exact'),
  rule('NC', 'North Carolina', 180, 192, 'exact'),
  rule('CA', 'California', 186, 192, 'exact'),
  rule('NJ', 'New Jersey', 192, 204, 'months'),
  rule('AK', 'Alaska', 168, 192),
  rule('AL', 'Alabama', 180, 192),
  rule('AR', 'Arkansas', 168, 192),
  rule('AZ', 'Arizona', 186, 192),
  rule('CO', 'Colorado', 180, 192),
  rule('CT', 'Connecticut', 192, 192),
  rule('DC', 'Washington, D.C.', 192, 204),
  rule('DE', 'Delaware', 190, 192),
  rule('FL', 'Florida', 180, 192),
  rule('GA', 'Georgia', 180, 192),
  rule('HI', 'Hawaii', 186, 192),
  rule('IA', 'Iowa', 168, 192),
  rule('ID', 'Idaho', 180, 180),
  rule('IL', 'Illinois', 180, 192),
  rule('IN', 'Indiana', 180, 192),
  rule('KS', 'Kansas', 168, 192),
  rule('KY', 'Kentucky', 180, 192),
  rule('LA', 'Louisiana', 180, 204),
  rule('MD', 'Maryland', 189, 198),
  rule('ME', 'Maine', 180, 192),
  rule('MI', 'Michigan', 177, 192),
  rule('MN', 'Minnesota', 180, 192),
  rule('MO', 'Missouri', 180, 192),
  rule('MS', 'Mississippi', 180, 192),
  rule('MT', 'Montana', 174, 180),
  rule('ND', 'North Dakota', 168, 192),
  rule('NE', 'Nebraska', 180, 192),
  rule('NH', 'New Hampshire', 186, 192),
  rule('NM', 'New Mexico', 180, 192),
  rule('NV', 'Nevada', 186, 192),
  rule('NY', 'New York', 192, 204),
  rule('OH', 'Ohio', 186, 192),
  rule('OK', 'Oklahoma', 186, 192),
  rule('OR', 'Oregon', 180, 192),
  rule('PA', 'Pennsylvania', 192, 198),
  rule('RI', 'Rhode Island', 192, 198),
  rule('SC', 'South Carolina', 180, 186),
  rule('SD', 'South Dakota', 180, 192),
  rule('TN', 'Tennessee', 180, 192),
  rule('TX', 'Texas', 180, 192),
  rule('UT', 'Utah', 180, 192),
  rule('VA', 'Virginia', 186, 195),
  rule('VT', 'Vermont', 180, 192),
  rule('WA', 'Washington', 180, 192),
  rule('WI', 'Wisconsin', 180, 192),
  rule('WV', 'West Virginia', 180, 192),
  rule('WY', 'Wyoming', 180, 192),
];

export const EXACT_STATES = STATE_RULES.filter((state) => state.mode === 'exact');
export const MONTHS_STATES = STATE_RULES.filter((state) => state.mode === 'months');
export const RANGE_STATES = STATE_RULES.filter((state) => state.mode === 'range').sort((a, b) =>
  a.code.localeCompare(b.code),
);

export function findStateRule(code: string): StateRule | null {
  return STATE_RULES.find((state) => state.code === code) ?? null;
}

/** 192 -> "16", 198 -> "16½", 190 -> "15y10m" */
export function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (remainder === 0) return String(years);
  if (remainder === 6) return `${years}½`;
  return `${years}y${remainder}m`;
}
