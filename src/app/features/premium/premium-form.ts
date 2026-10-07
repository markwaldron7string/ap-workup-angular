import { Component, inject } from '@angular/core';
import { formatCurrency } from '../../shared/currency-utils';
import { DecimalInput } from '../../shared/ui/decimal-input/decimal-input';
import { PremiumFormStore } from './premium-form.store';

/** The premium form card. All of its state and behaviour is in PremiumFormStore. */
@Component({
  selector: 'app-premium-form',
  imports: [DecimalInput],
  templateUrl: './premium-form.html',
  host: { class: 'card premium-card' },
})
export class PremiumForm {
  protected readonly store = inject(PremiumFormStore);
  protected readonly formatCurrency = formatCurrency;
}
