import { Component, inject, input } from '@angular/core';
import { ClipboardService } from '../../../core/clipboard.service';
import { CalcResult } from '../../calc-result';
import { CopyAllCapsButton } from '../copy-all-caps-button/copy-all-caps-button';
import { ResultBody } from '../result-body/result-body';

/** The coloured card under a calculator. The host element itself is the `.result` box. */
@Component({
  selector: 'app-result-card',
  imports: [ResultBody, CopyAllCapsButton],
  templateUrl: './result-card.html',
  host: {
    class: 'result',
    '[class.success]': "result().tone === 'success'",
    '[class.warn]': "result().tone === 'warn'",
    '[class.danger]': "result().tone === 'danger'",
  },
})
export class ResultCard {
  protected readonly clipboard = inject(ClipboardService);

  readonly result = input.required<CalcResult>();
  /** Also offer the hidden all-caps copy button. */
  readonly allCaps = input(false);

  protected copy(text: string, event: Event): void {
    this.clipboard.copy(text, event.currentTarget as HTMLElement);
  }
}
