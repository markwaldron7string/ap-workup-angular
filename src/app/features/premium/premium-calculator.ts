import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/theme.service';
import { ResultCard } from '../../shared/ui/result-card/result-card';
import { PremiumForm } from './premium-form';
import { PremiumFormStore } from './premium-form.store';
import { PremiumSheet } from './premium-sheet';

/** The premium column: the spreadsheet table in the original theme, the form and its result otherwise. */
@Component({
  selector: 'app-premium-calculator',
  imports: [PremiumForm, PremiumSheet, ResultCard],
  templateUrl: './premium-calculator.html',
  host: { class: 'calc-column' },
})
export class PremiumCalculator {
  protected readonly themes = inject(ThemeService);

  /** The form's result. Public because the page layout changes when both calculators show one. */
  readonly formResult = inject(PremiumFormStore).result.asReadonly();
}
