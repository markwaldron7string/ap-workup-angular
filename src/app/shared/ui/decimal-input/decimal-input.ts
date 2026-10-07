import { Directive } from '@angular/core';
import { sanitizeDecimalText } from '../../currency-utils';

/** Limits a text input to digits and a decimal point, for typing and for pasting. */
@Directive({
  selector: 'input[appDecimalInput]',
  host: {
    '(keydown)': 'guardKey($event)',
    '(paste)': 'sanitizePaste($event)',
  },
})
export class DecimalInput {
  protected guardKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // Only printable characters are ever blocked. Named keys (Escape, F5, PageDown, the
    // "Unidentified" key of on-screen keyboards) are left to the browser.
    if (event.key.length !== 1) return;

    if (!/[\d.]/.test(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === '.') {
      const input = event.target as HTMLInputElement;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      const remaining = input.value.slice(0, start) + input.value.slice(end);
      if (remaining.includes('.')) event.preventDefault();
    }
  }

  protected sanitizePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = sanitizeDecimalText(event.clipboardData?.getData('text') ?? '');
    if (!pasted) return;

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const value = sanitizeDecimalText(
      input.value.slice(0, start) + pasted + input.value.slice(end),
    );
    const caret = Math.min(start + pasted.length, value.length);

    input.value = value;
    input.setSelectionRange(caret, caret);
    // The paste itself was cancelled, so tell the field's own (input) handler about the new text.
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
