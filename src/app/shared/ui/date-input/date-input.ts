import { Component, ElementRef, computed, input, model, signal, viewChild } from '@angular/core';
import { formatShortDate, parseDate } from '../../date-utils';
import { CalendarPopup } from '../calendar-popup/calendar-popup';
import { caretAfterDigits, countDigits, maskDateText } from './date-mask';

const POPUP_WIDTH = 268;
const POPUP_HEIGHT = 316;

/**
 * A mm/dd/yyyy text field with a calendar button. The slashes are typed for the user, and
 * `value` is two-way bound to the field's text. Parsing the text into a Date is left to the parent.
 */
@Component({
  selector: 'app-date-input',
  imports: [CalendarPopup],
  templateUrl: './date-input.html',
  host: {
    class: 'date-wrap',
    '(document:pointerdown)': 'closeCalendarIfOutside($event)',
  },
})
export class DateInput {
  readonly inputId = input.required<string>();
  readonly value = model('');

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private readonly calendarButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('calendarButton');
  private readonly popup = viewChild(CalendarPopup, { read: ElementRef });

  protected readonly calendarOpen = signal(false);
  protected readonly popupTop = signal(0);
  protected readonly popupLeft = signal(0);
  protected readonly selectedDate = computed(() => parseDate(this.value()));

  protected onInput(): void {
    this.applyText(this.field().nativeElement.value);
  }

  /** On leaving the field, a date that can be read is rewritten in full: 1/2/26 -> 01/02/2026. */
  protected onBlur(): void {
    const trimmed = this.value().trim();
    const parsed = parseDate(trimmed);
    this.value.set(parsed ? formatShortDate(parsed) : trimmed);
  }

  /**
   * Blocks keys that cannot be part of a date. Backspace and Delete next to a slash are handled
   * here too, so that one press removes the digit on the far side instead of doing nothing.
   */
  protected guardKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const input = event.target as HTMLInputElement;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;

    if (event.key === 'Backspace' || event.key === 'Delete') {
      if (selectionStart !== selectionEnd) return;

      const adjacentIndex = event.key === 'Backspace' ? selectionStart - 1 : selectionStart;
      if (input.value[adjacentIndex] !== '/') return;

      let deleteIndex = adjacentIndex;
      if (event.key === 'Backspace') {
        while (deleteIndex >= 0 && input.value[deleteIndex] === '/') deleteIndex--;
        if (deleteIndex < 0) {
          event.preventDefault();
          return;
        }
      } else {
        while (deleteIndex < input.value.length && input.value[deleteIndex] === '/') deleteIndex++;
        if (deleteIndex >= input.value.length) {
          event.preventDefault();
          return;
        }
      }

      event.preventDefault();
      this.deleteCharacter(input, deleteIndex);
      if (event.key === 'Delete') input.setSelectionRange(selectionStart, selectionStart);
      return;
    }

    // Only printable characters are ever blocked. Named keys (Escape, F5, PageDown, the
    // "Unidentified" key of on-screen keyboards) are left to the browser.
    if (event.key.length !== 1) return;

    if (!/\d/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const selectedText = input.value.slice(selectionStart, selectionEnd);
    if (countDigits(input.value) - countDigits(selectedText) >= 8) {
      event.preventDefault();
    }
  }

  protected toggleCalendar(): void {
    if (this.calendarOpen()) {
      this.calendarOpen.set(false);
      return;
    }

    // Open below the field, or above it / shifted left when there is no room.
    const rect = this.field().nativeElement.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.left;
    if (left + POPUP_WIDTH > window.innerWidth - 8) left = window.innerWidth - POPUP_WIDTH - 8;
    if (top + POPUP_HEIGHT > window.innerHeight - 8) top = rect.top - POPUP_HEIGHT - 6;
    this.popupTop.set(top);
    this.popupLeft.set(left);
    this.calendarOpen.set(true);
  }

  protected pickDate(date: Date): void {
    this.value.set(formatShortDate(date));
    this.calendarOpen.set(false);
  }

  protected closeCalendarIfOutside(event: Event): void {
    if (!this.calendarOpen()) return;
    const target = event.target as Node;
    if (this.popup()?.nativeElement.contains(target)) return;
    if (this.calendarButton().nativeElement.contains(target)) return;
    this.calendarOpen.set(false);
  }

  private deleteCharacter(input: HTMLInputElement, deleteIndex: number): void {
    const caret = input.selectionStart ?? input.value.length;
    const digitsBefore = countDigits(input.value.slice(0, caret));
    const deletedDigit = /\d/.test(input.value[deleteIndex]);
    const newDigitsBefore = deletedDigit && deleteIndex < caret ? digitsBefore - 1 : digitsBefore;
    const newValue = input.value.slice(0, deleteIndex) + input.value.slice(deleteIndex + 1);
    this.applyText(newValue, newDigitsBefore);
  }

  /** Masks the text and puts the caret back where the user was typing. */
  private applyText(text: string, digitsBeforeCaret?: number): void {
    const input = this.field().nativeElement;
    const caret = input.selectionStart ?? text.length;
    const digitsBefore = digitsBeforeCaret ?? countDigits(text.slice(0, caret));
    const masked = maskDateText(text);
    const newCaret = caretAfterDigits(masked, digitsBefore);

    input.value = masked;
    input.setSelectionRange(newCaret, newCaret);
    this.value.set(masked);
  }
}
