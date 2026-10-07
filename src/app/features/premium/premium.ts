import { CalcResult, plain, strong } from '../../shared/calc-result';
import {
  formatClipboardCurrency,
  formatCurrency,
  formatDollars,
  parseCurrency,
} from '../../shared/currency-utils';

export type PremiumKind = 'old' | 'new';

/** One "TYPE NEW DATA" row of the original-theme premium table. */
export interface SheetRow {
  oldInput: string;
  newInput: string;
  feeInput: string;
  fees: number[];
  change: string;
  result: CalcResult | null;
}

export function sumFees(fees: readonly number[]): number {
  return fees.reduce((sum, fee) => sum + fee, 0);
}

/** A premium with the fixed fees taken off, or null while the premium is not entered. */
export function netOfFees(premium: number | null, totalFees: number): number | null {
  return premium !== null ? premium - totalFees : null;
}

/** Fees may not use up the whole old premium, or more than the new premium. */
export function feesExceedPremium(netOld: number | null, netNew: number | null): boolean {
  return (netOld !== null && netOld <= 0) || (netNew !== null && netNew < 0);
}

export function buildPremiumResult(
  oldPrem: number,
  newPrem: number,
  totalFees: number,
): CalcResult {
  const rawPct = (newPrem / oldPrem - 1) * 100;
  const pct = Math.round(rawPct * 10) / 10;
  const meta = `$${formatCurrency(oldPrem)} → $${formatCurrency(newPrem)}`;
  const extraMeta =
    totalFees > 0 ? `Fixed fees excluded: $${formatCurrency(totalFees)}` : undefined;

  if (pct > 0) {
    return {
      tone: 'success',
      icon: 'up',
      title: 'Premium increase',
      copyText: premiumClipboardText(oldPrem, newPrem, pct),
      premiumPct: `+${pct.toFixed(1)}%`,
      premiumClass: 'increase',
      meta,
      extraMeta,
    };
  }
  if (pct < 0) {
    return {
      tone: 'danger',
      icon: 'down',
      title: 'Premium decrease',
      premiumPct: `${pct.toFixed(1)}%`,
      premiumClass: 'decrease',
      meta,
      extraMeta,
    };
  }
  return {
    tone: 'warn',
    icon: 'flat',
    title: 'No change',
    premiumPct: '0.0%',
    premiumClass: 'flat',
    meta,
    extraMeta,
  };
}

/** The warning shown instead of a result. `fee` is the fee being added, or null when the fees are already in place. */
export function feeExceedsResult(
  fee: number | null,
  netOld: number | null,
  netNew: number | null,
): CalcResult {
  const amount = (value: number | null) => (value !== null ? formatDollars(value) : '$-');
  const rest = ' an adjusted old premium of ';
  const lead =
    fee !== null
      ? [plain('Adding a fee of '), strong(amount(fee)), plain(` would leave${rest}`)]
      : [plain(`The fixed fees leave${rest}`)];
  return {
    tone: 'warn',
    icon: 'warn',
    title: 'Fixed fee exceeds premium',
    body: [
      [
        ...lead,
        strong(amount(netOld)),
        plain(' and adjusted new premium of '),
        strong(amount(netNew)),
        plain('. Please verify the fee.'),
      ],
    ],
  };
}

function premiumClipboardText(oldPrem: number, newPrem: number, pct: number): string {
  return [
    `Old premium: $${formatClipboardCurrency(oldPrem)}`,
    `New premium: $${formatClipboardCurrency(newPrem)}`,
    `% Difference: ${pct.toFixed(1)}%`,
  ].join('\n');
}

export function blankSheetRow(): SheetRow {
  return { oldInput: '', newInput: '', feeInput: '', fees: [], change: '', result: null };
}

/** Works out a table row's Change Amount and % Change from what has been typed into it. */
export function recalcSheetRow(row: SheetRow): SheetRow {
  const oldPrem = parseCurrency(row.oldInput);
  const newPrem = parseCurrency(row.newInput);
  if (oldPrem === null || newPrem === null) return { ...row, change: '', result: null };

  const total = sumFees(row.fees);
  const netOld = oldPrem - total;
  const netNew = newPrem - total;
  if (feesExceedPremium(netOld, netNew)) {
    return { ...row, change: '', result: feeExceedsResult(null, netOld, netNew) };
  }
  return {
    ...row,
    change: formatCurrency(netNew - netOld),
    result: buildPremiumResult(netOld, netNew, total),
  };
}
