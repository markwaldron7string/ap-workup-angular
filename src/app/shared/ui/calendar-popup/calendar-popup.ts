import { Component, OnInit, computed, input, output, signal } from '@angular/core';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** The month grid shown under a date field. It opens on the selected date's month, or today's. */
@Component({
  selector: 'app-calendar-popup',
  templateUrl: './calendar-popup.html',
  host: { id: 'calPopup' },
})
export class CalendarPopup implements OnInit {
  readonly selected = input<Date | null>(null);
  readonly picked = output<Date>();

  protected readonly year = signal(0);
  protected readonly month = signal(0);

  protected readonly label = computed(() => `${MONTH_NAMES[this.month()]} ${this.year()}`);
  /** Empty cells before the 1st, so that it lands under the right weekday. */
  protected readonly blanks = computed(() =>
    Array.from({ length: new Date(this.year(), this.month(), 1).getDay() }, (_, i) => i),
  );
  protected readonly days = computed(() => {
    const count = new Date(this.year(), this.month() + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    const start = this.selected() ?? new Date();
    this.year.set(start.getFullYear());
    this.month.set(start.getMonth());
  }

  protected changeMonth(delta: number): void {
    const month = this.month() + delta;
    if (month < 0) {
      this.month.set(11);
      this.year.update((year) => year - 1);
    } else if (month > 11) {
      this.month.set(0);
      this.year.update((year) => year + 1);
    } else {
      this.month.set(month);
    }
  }

  protected changeYear(delta: number): void {
    this.year.update((year) => year + delta);
  }

  protected isToday(day: number): boolean {
    return this.isSameDay(new Date(), day);
  }

  protected isSelected(day: number): boolean {
    const selected = this.selected();
    return !!selected && this.isSameDay(selected, day);
  }

  protected pick(day: number): void {
    this.picked.emit(new Date(this.year(), this.month(), day, 12, 0, 0));
  }

  private isSameDay(date: Date, day: number): boolean {
    return (
      date.getFullYear() === this.year() &&
      date.getMonth() === this.month() &&
      date.getDate() === day
    );
  }
}
