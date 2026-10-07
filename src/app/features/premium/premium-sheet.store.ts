import { Injectable, computed, signal } from '@angular/core';
import { formatCurrency, parseCurrency } from '../../shared/currency-utils';
import {
  PremiumKind,
  SheetRow,
  blankSheetRow,
  feeExceedsResult,
  feesExceedPremium,
  netOfFees,
  recalcSheetRow,
  sumFees,
} from './premium';

const STARTING_ROWS = 8;

function blankRows(): SheetRow[] {
  return Array.from({ length: STARTING_ROWS }, blankSheetRow);
}

/**
 * State of the original-theme premium table. Like the form's store, it lives in a service so the
 * rows are still there after switching to another theme and back.
 */
@Injectable({ providedIn: 'root' })
export class PremiumSheetStore {
  readonly rows = signal<SheetRow[]>(blankRows());
  readonly selectedIndex = signal(0);
  readonly selectedRow = computed(() => this.rows()[this.selectedIndex()]);

  select(index: number): void {
    this.selectedIndex.set(Math.max(0, Math.min(index, this.rows().length - 1)));
  }

  /** Stores a premium cell and returns the tidied text for the cell to show. */
  commitPremium(index: number, kind: PremiumKind, text: string): string {
    const parsed = parseCurrency(text);
    const value = parsed !== null ? formatCurrency(parsed) : '';
    this.recalcRow(index, (row) =>
      kind === 'old' ? { ...row, oldInput: value } : { ...row, newInput: value },
    );
    return value;
  }

  /** Adds the typed fee to the row. Returns false, leaving the text in the cell, if it is too large. */
  commitFee(index: number, text: string): boolean {
    const row = this.rows()[index];
    const fee = parseCurrency(text);
    if (fee === null) {
      this.recalcRow(index, (current) => ({ ...current, feeInput: '' }));
      return true;
    }

    const total = sumFees(row.fees) + fee;
    const netOld = netOfFees(parseCurrency(row.oldInput), total);
    const netNew = netOfFees(parseCurrency(row.newInput), total);
    if (feesExceedPremium(netOld, netNew)) {
      this.replaceRow(index, {
        ...row,
        feeInput: text,
        change: '',
        result: feeExceedsResult(fee, netOld, netNew),
      });
      return false;
    }

    this.recalcRow(index, (current) => ({
      ...current,
      feeInput: '',
      fees: [...current.fees, fee],
    }));
    return true;
  }

  removeFee(index: number, feeIndex: number): void {
    this.recalcRow(index, (row) => ({
      ...row,
      fees: row.fees.filter((_, i) => i !== feeIndex),
    }));
  }

  clearSelectedRow(): void {
    this.replaceRow(this.selectedIndex(), blankSheetRow());
  }

  clearAll(): void {
    this.rows.set(blankRows());
    this.selectedIndex.set(0);
  }

  private replaceRow(index: number, row: SheetRow): void {
    this.rows.update((rows) => rows.map((current, i) => (i === index ? row : current)));
  }

  /** Applies a change to a row, recalculates it, and keeps an empty row available at the bottom. */
  private recalcRow(index: number, change: (row: SheetRow) => SheetRow): void {
    this.rows.update((rows) => {
      const next = rows.map((row, i) => (i === index ? recalcSheetRow(change(row)) : row));
      const last = next[next.length - 1];
      if (last.oldInput || last.newInput || last.fees.length) next.push(blankSheetRow());
      return next;
    });
  }
}
