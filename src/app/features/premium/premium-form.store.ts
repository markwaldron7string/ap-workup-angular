import { Injectable, computed, signal } from '@angular/core';
import { CalcResult } from '../../shared/calc-result';
import { formatCurrency, parseCurrency } from '../../shared/currency-utils';
import {
  PremiumKind,
  buildPremiumResult,
  feeExceedsResult,
  feesExceedPremium,
  netOfFees,
  sumFees,
} from './premium';

/**
 * One premium field. `gross` is the premium as entered. Once fees are applied the field shows
 * the net figure instead, and `showsNet` records that so the text can be read back correctly.
 */
class PremiumField {
  readonly text = signal('');
  readonly gross = signal<number | null>(null);
  showsNet = false;
}

/**
 * State of the premium form (light and dark themes). It lives in a service rather than the
 * component so that it survives while the original theme swaps the form out for the table.
 */
@Injectable({ providedIn: 'root' })
export class PremiumFormStore {
  readonly fields: Record<PremiumKind, PremiumField> = {
    old: new PremiumField(),
    new: new PremiumField(),
  };
  readonly feeText = signal('');
  readonly fees = signal<number[]>([]);
  readonly result = signal<CalcResult | null>(null);

  readonly feeTotal = computed(() => sumFees(this.fees()));
  readonly netOld = computed(() => netOfFees(this.fields.old.gross(), this.feeTotal()));
  readonly netNew = computed(() => netOfFees(this.fields.new.gross(), this.feeTotal()));
  readonly ready = computed(() => {
    const netOld = this.netOld();
    const netNew = this.netNew();
    return netOld !== null && netOld > 0 && netNew !== null && netNew >= 0;
  });

  /** Called on every keystroke. Typed text is always taken as the gross premium. */
  typePremium(kind: PremiumKind, text: string): void {
    const field = this.fields[kind];
    field.text.set(text);
    field.gross.set(parseCurrency(text));
    field.showsNet = false;
    this.result.set(null);
  }

  /** Called when a premium field loses focus: settles its value and tidies both fields' text. */
  commitPremium(kind: PremiumKind): void {
    const field = this.fields[kind];
    const parsed = parseCurrency(field.text());
    const gross = parsed !== null ? (field.showsNet ? parsed + this.feeTotal() : parsed) : null;
    const previous = field.gross();
    field.gross.set(gross);
    this.showNetPremiums();
    if (gross !== previous) this.result.set(null);
  }

  /** Moves the typed fee into the fee list. Returns false if there was no fee or it was too large. */
  addFee(): boolean {
    const fee = parseCurrency(this.feeText());
    if (fee === null) return false;

    const newTotal = this.feeTotal() + fee;
    const netOld = netOfFees(this.fields.old.gross(), newTotal);
    const netNew = netOfFees(this.fields.new.gross(), newTotal);
    if (feesExceedPremium(netOld, netNew)) {
      this.result.set(feeExceedsResult(fee, netOld, netNew));
      return false;
    }

    this.fees.update((fees) => [...fees, fee]);
    this.feeText.set('');
    this.showNetPremiums();
    this.result.set(null);
    return true;
  }

  removeFee(index: number): void {
    this.fees.update((fees) => fees.filter((_, i) => i !== index));
    this.showNetPremiums();
    this.result.set(null);
  }

  calculate(): void {
    // A fee still sitting in the field counts, even if "Add fee" was never pressed.
    if (parseCurrency(this.feeText()) !== null && !this.addFee()) return;

    const netOld = this.netOld();
    const netNew = this.netNew();
    if (!this.ready() || netOld === null || netNew === null) return;
    this.result.set(buildPremiumResult(netOld, netNew, this.feeTotal()));
  }

  clear(): void {
    for (const field of Object.values(this.fields)) {
      field.text.set('');
      field.gross.set(null);
      field.showsNet = false;
    }
    this.feeText.set('');
    this.fees.set([]);
    this.result.set(null);
  }

  private showNetPremiums(): void {
    for (const field of Object.values(this.fields)) {
      const gross = field.gross();
      if (gross === null) continue;
      field.text.set(formatCurrency(gross - this.feeTotal()));
      field.showsNet = true;
    }
  }
}
