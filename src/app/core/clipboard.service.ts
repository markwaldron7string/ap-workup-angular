import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

const COPIED_FEEDBACK_MS = 2000;

/** Copies text and remembers it briefly, so whichever button copied it can show "Copied". */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly document = inject(DOCUMENT);
  private readonly copied = signal('');
  private resetHandle: number | null = null;

  /** The text copied most recently, or '' once the feedback has timed out. */
  readonly copiedText = this.copied.asReadonly();

  /** `source` is the button that was pressed. It is blurred so its hover flag does not stay open. */
  copy(text: string, source?: HTMLElement): void {
    this.copied.set(text);
    if (this.resetHandle !== null) window.clearTimeout(this.resetHandle);
    this.resetHandle = window.setTimeout(() => {
      if (this.copied() === text) this.copied.set('');
      this.resetHandle = null;
      source?.blur();
    }, COPIED_FEEDBACK_MS);

    source?.blur();
    void this.write(text);
  }

  private async write(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return this.writeWithTextarea(text);
      }
    }

    return this.writeWithTextarea(text);
  }

  /** For browsers and contexts (plain http, for one) where the async clipboard API is unavailable. */
  private writeWithTextarea(text: string): boolean {
    const textarea = this.document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    this.document.body.appendChild(textarea);
    textarea.select();

    try {
      return this.document.execCommand('copy');
    } finally {
      this.document.body.removeChild(textarea);
    }
  }
}
