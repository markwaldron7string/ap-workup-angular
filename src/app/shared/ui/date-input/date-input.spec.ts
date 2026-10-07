import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { domOf } from '../../../../testing/dom';
import { DateInput } from './date-input';

@Component({
  imports: [DateInput],
  template: `<app-date-input inputId="testDate" [(value)]="text" />`,
})
class Host {
  readonly text = signal('');
}

describe('DateInput', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let dom: ReturnType<typeof domOf<Host>>;
  let input: HTMLInputElement;

  /** Puts text and a caret in the field, as if the browser had just applied a keystroke. */
  function setField(value: string, caret: number, caretEnd = caret): void {
    input.value = value;
    input.setSelectionRange(caret, caretEnd);
  }

  function typed(value: string, caret: number): void {
    setField(value, caret);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    input.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    dom = domOf(fixture);
    input = dom.get<HTMLInputElement>('#testDate');
  });

  it('shows the value it is given', () => {
    host.text.set('02/14/1999');
    fixture.detectChanges();

    expect(input.value).toBe('02/14/1999');
  });

  it('blocks keys that are not digits', () => {
    expect(press('a').defaultPrevented).toBe(true);
    expect(press('5').defaultPrevented).toBe(false);
    expect(press('Tab').defaultPrevented).toBe(false);
  });

  it('leaves named keys such as Escape, F5 and PageDown to the browser', () => {
    for (const key of ['Escape', 'F5', 'F12', 'PageDown', 'Unidentified']) {
      expect(press(key).defaultPrevented, key).toBe(false);
    }
  });

  it('blocks a ninth digit', () => {
    setField('01/23/4567', 10);

    expect(press('9').defaultPrevented).toBe(true);
  });

  it('allows selected date digits to be replaced when the date already has eight digits', () => {
    setField('01/23/4567', 0, 2);

    expect(press('9').defaultPrevented).toBe(false);
  });

  it('deletes the previous digit in one backspace when the cursor is after a slash', () => {
    setField('02/14/1999', 6);

    const backspace = press('Backspace');

    expect(backspace.defaultPrevented).toBe(true);
    expect(host.text()).toBe('02/1/1999');
    expect(input.value).toBe('02/1/1999');
    expect(input.selectionStart).toBe(4);
    expect(input.selectionEnd).toBe(4);
  });

  it('deletes the next digit in one delete when the cursor is on a slash', () => {
    setField('02/14/1999', 5);

    const deleteKey = press('Delete');

    expect(deleteKey.defaultPrevented).toBe(true);
    expect(host.text()).toBe('02/14/999');
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
  });

  it('preserves the cursor position after date input is reformatted', () => {
    typed('02/1/1999', 4);

    expect(host.text()).toBe('02/1/1999');
    expect(input.selectionStart).toBe(4);
    expect(input.selectionEnd).toBe(4);
  });

  it('allows editing a day segment down without snapping to the max mid-edit', () => {
    typed('07/5/2026', 4);

    expect(host.text()).toBe('07/5/2026');
  });

  it('lets a corrected day digit slot back in without corrupting the year (07/05/2026 -> 07/15/2026)', () => {
    typed('07/5/2026', 4);
    expect(host.text()).toBe('07/5/2026');

    typed('07/15/2026', 5);

    expect(host.text()).toBe('07/15/2026');
  });

  it('keeps date rollover behavior after masked date input is applied', () => {
    typed('06/31/2026', 10);
    expect(host.text()).toBe('06/31/2026');

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.text()).toBe('07/01/2026');
    expect(input.value).toBe('07/01/2026');
  });

  it('completes a short date when the field is left', () => {
    typed('01/02/26', 8);

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.text()).toBe('01/02/2026');
  });
});
