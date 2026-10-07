import { Component, computed, signal } from '@angular/core';
import { CalcResult } from '../../shared/calc-result';
import { parseDate } from '../../shared/date-utils';
import { DateInput } from '../../shared/ui/date-input/date-input';
import { isCompleteDateText } from '../../shared/ui/date-input/date-mask';
import { DecimalInput } from '../../shared/ui/decimal-input/decimal-input';
import { ResultCard } from '../../shared/ui/result-card/result-card';
import {
  EXACT_STATES,
  MONTHS_STATES,
  OutputMode,
  RANGE_STATES,
  findStateRule,
  formatAge,
} from './state-rules';
import { calculateYearsLicensed } from './years-licensed';

const MODE_LABELS: Record<OutputMode, string> = {
  exact: 'Exact calculation',
  months: 'Months licensed (NJ)',
  range: 'Range output',
};

function parseCompleteDate(text: string): Date | null {
  return isCompleteDateText(text) ? parseDate(text) : null;
}

@Component({
  selector: 'app-years-licensed-calculator',
  imports: [DateInput, DecimalInput, ResultCard],
  templateUrl: './years-licensed-calculator.html',
  host: { class: 'calc-column' },
})
export class YearsLicensedCalculator {
  protected readonly exactStates = EXACT_STATES;
  protected readonly monthsStates = MONTHS_STATES;
  protected readonly rangeStates = RANGE_STATES;
  protected readonly formatAge = formatAge;

  protected readonly stateCode = signal('');
  /** Text of the first date field: the date of birth, or the issue date while that override is on. */
  protected readonly primaryText = signal('');
  protected readonly workupText = signal('');
  protected readonly ageText = signal('');
  /** "Original DL Issue Date" override: the first date field holds the issue date instead. */
  protected readonly issueDateEnabled = signal(false);
  /** "Age First Licensed" override. The page layout also reads this, to make room for the field. */
  readonly ageEnabled = signal(false);
  readonly result = signal<CalcResult | null>(null);

  /** The date of birth that was typed before the issue date override took over its field. */
  private dobTextBeforeOverride = '';

  protected readonly rule = computed(() => findStateRule(this.stateCode()));
  protected readonly modeLabel = computed(() => {
    const rule = this.rule();
    return rule ? MODE_LABELS[rule.mode] : '';
  });
  protected readonly primaryLabel = computed(() =>
    this.issueDateEnabled() ? 'Original DL Issue Date' : "Driver's Date of Birth",
  );

  private readonly primaryDate = computed(() => parseCompleteDate(this.primaryText()));
  private readonly workupDate = computed(() => parseCompleteDate(this.workupText()));
  private readonly reportedAge = computed(() => {
    if (!this.ageEnabled()) return null;
    const age = parseFloat(this.ageText().trim());
    return !isNaN(age) && age > 0 && age < 100 ? age : null;
  });

  protected readonly ready = computed(
    () =>
      !!this.rule() &&
      !!this.primaryDate() &&
      !!this.workupDate() &&
      (!this.ageEnabled() || this.reportedAge() !== null),
  );

  protected onStateChange(code: string): void {
    this.stateCode.set(code);
    this.result.set(null);
  }

  protected onPrimaryText(text: string): void {
    this.primaryText.set(text);
    this.result.set(null);
  }

  protected onWorkupText(text: string): void {
    this.workupText.set(text);
    this.result.set(null);
  }

  protected onAgeText(text: string): void {
    this.ageText.set(text);
    this.result.set(null);
  }

  /** The two overrides are mutually exclusive: turning one on turns the other off. */
  protected toggleIssueDate(enabled: boolean): void {
    if (enabled) {
      this.disableAge();
      this.issueDateEnabled.set(true);
      this.dobTextBeforeOverride = this.primaryText();
      this.primaryText.set('');
    } else {
      this.disableIssueDate();
    }
    this.result.set(null);
  }

  protected toggleAge(enabled: boolean): void {
    if (enabled) {
      this.disableIssueDate();
      this.ageEnabled.set(true);
    } else {
      this.disableAge();
    }
    this.result.set(null);
  }

  protected calculate(): void {
    const rule = this.rule();
    const workup = this.workupDate();
    if (!this.ready() || !rule || !workup) return;

    const usingIssueDate = this.issueDateEnabled();
    this.result.set(
      calculateYearsLicensed({
        rule,
        workup,
        dob: usingIssueDate ? null : this.primaryDate(),
        issueDate: usingIssueDate ? this.primaryDate() : null,
        reportedAge: this.reportedAge(),
      }),
    );
  }

  protected clear(): void {
    this.stateCode.set('');
    this.primaryText.set('');
    this.workupText.set('');
    this.ageText.set('');
    this.issueDateEnabled.set(false);
    this.ageEnabled.set(false);
    this.dobTextBeforeOverride = '';
    this.result.set(null);
  }

  private disableIssueDate(): void {
    if (!this.issueDateEnabled()) return;
    this.issueDateEnabled.set(false);
    this.primaryText.set(this.dobTextBeforeOverride);
  }

  private disableAge(): void {
    if (!this.ageEnabled()) return;
    this.ageEnabled.set(false);
    this.ageText.set('');
  }
}
