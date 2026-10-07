import { Component, computed, inject, input } from '@angular/core';
import { ClipboardService } from '../../../core/clipboard.service';

/**
 * The hidden "COPY ALL CAPS" button. It is applied to a real <button> as an attribute, so the
 * element keeps its native button behaviour: <button [appCopyAllCaps]="text"></button>
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- an attribute selector, so the host stays a native <button>
  selector: 'button[appCopyAllCaps]',
  templateUrl: './copy-all-caps-button.html',
  host: {
    class: 'result-secret-btn',
    type: 'button',
    '[class.copied]': 'copied()',
    '[attr.aria-label]': "copied() ? 'Copied' : 'Copy'",
    '(click)': 'copy($event)',
  },
})
export class CopyAllCapsButton {
  private readonly clipboard = inject(ClipboardService);

  readonly text = input.required<string>({ alias: 'appCopyAllCaps' });

  private readonly upperText = computed(() => this.text().toUpperCase());
  protected readonly copied = computed(() => this.clipboard.copiedText() === this.upperText());

  protected copy(event: Event): void {
    this.clipboard.copy(this.upperText(), event.currentTarget as HTMLElement);
  }
}
