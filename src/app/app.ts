import { Component, HostListener, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

type Theme = 'dark' | 'light' | 'original';
type Tone = 'success' | 'warn' | 'danger';
type CalendarTarget = 'primary' | 'workup';

interface StateRule {
  pM: number;
  lM: number;
  pL: string;
  lL: string;
}

interface Diff {
  years: number;
  months: number;
  days: number;
}

interface ResultModel {
  tone: Tone;
  icon: 'check' | 'warn' | 'x' | 'up' | 'down' | 'flat';
  title: string;
  copyText?: string;
  bodyHtml?: string;
  tileNum?: number;
  tileLabel?: string;
  badge?: string;
  meta?: string;
  extraMeta?: string;
  premiumPct?: string;
  premiumClass?: 'increase' | 'decrease' | 'flat';
}

const STATE_DATA: Record<string, StateRule> = {
  MA: { pM: 192, lM: 198, pL: '16', lL: '16½' },
  NC: { pM: 180, lM: 192, pL: '15', lL: '16' },
  CA: { pM: 186, lM: 192, pL: '15½', lL: '16' },
  NJ: { pM: 192, lM: 204, pL: '16', lL: '17' },
  DC: { pM: 192, lM: 204, pL: '16', lL: '17' },
  AL: { pM: 180, lM: 192, pL: '15', lL: '16' },
  AK: { pM: 168, lM: 192, pL: '14', lL: '16' },
  AZ: { pM: 186, lM: 192, pL: '15½', lL: '16' },
  AR: { pM: 168, lM: 192, pL: '14', lL: '16' },
  CO: { pM: 180, lM: 192, pL: '15', lL: '16' },
  CT: { pM: 192, lM: 192, pL: '16', lL: '16' },
  DE: { pM: 190, lM: 192, pL: '15y10m', lL: '16' },
  FL: { pM: 180, lM: 192, pL: '15', lL: '16' },
  GA: { pM: 180, lM: 192, pL: '15', lL: '16' },
  HI: { pM: 186, lM: 204, pL: '15½', lL: '17' },
  ID: { pM: 180, lM: 216, pL: '15', lL: '18' },
  IL: { pM: 180, lM: 192, pL: '15', lL: '16' },
  IN: { pM: 180, lM: 192, pL: '15', lL: '16' },
  IA: { pM: 168, lM: 192, pL: '14', lL: '16' },
  KS: { pM: 168, lM: 192, pL: '14', lL: '16' },
  KY: { pM: 180, lM: 192, pL: '15', lL: '16' },
  LA: { pM: 180, lM: 204, pL: '15', lL: '17' },
  ME: { pM: 180, lM: 192, pL: '15', lL: '16' },
  MD: { pM: 189, lM: 216, pL: '15y9m', lL: '18' },
  MI: { pM: 177, lM: 192, pL: '14y9m', lL: '16' },
  MN: { pM: 180, lM: 192, pL: '15', lL: '16' },
  MS: { pM: 180, lM: 192, pL: '15', lL: '16' },
  MO: { pM: 180, lM: 192, pL: '15', lL: '16' },
  MT: { pM: 174, lM: 180, pL: '14½', lL: '15' },
  NE: { pM: 180, lM: 204, pL: '15', lL: '17' },
  NV: { pM: 186, lM: 192, pL: '15½', lL: '16' },
  NH: { pM: 186, lM: 192, pL: '15½', lL: '16' },
  NM: { pM: 180, lM: 192, pL: '15', lL: '16' },
  NY: { pM: 192, lM: 204, pL: '16', lL: '17' },
  ND: { pM: 168, lM: 192, pL: '14', lL: '16' },
  OH: { pM: 186, lM: 192, pL: '15½', lL: '16' },
  OK: { pM: 186, lM: 192, pL: '15½', lL: '16' },
  OR: { pM: 180, lM: 192, pL: '15', lL: '16' },
  PA: { pM: 192, lM: 198, pL: '16', lL: '16½' },
  RI: { pM: 192, lM: 204, pL: '16', lL: '17' },
  SC: { pM: 180, lM: 204, pL: '15', lL: '17' },
  SD: { pM: 180, lM: 192, pL: '15', lL: '16' },
  TN: { pM: 180, lM: 192, pL: '15', lL: '16' },
  TX: { pM: 180, lM: 192, pL: '15', lL: '16' },
  UT: { pM: 180, lM: 192, pL: '15', lL: '16' },
  VT: { pM: 180, lM: 192, pL: '15', lL: '16' },
  VA: { pM: 186, lM: 195, pL: '15½', lL: '16y3m' },
  WA: { pM: 180, lM: 192, pL: '15', lL: '16' },
  WV: { pM: 180, lM: 192, pL: '15', lL: '16' },
  WI: { pM: 180, lM: 192, pL: '15', lL: '16' },
  WY: { pM: 180, lM: 192, pL: '15', lL: '16' },
};

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'Washington, D.C.',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NM: 'New Mexico',
  NY: 'New York',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

const EXACT_STATES = ['MA', 'NC', 'CA'];

@Component({
  selector: 'app-root',
  imports: [NgTemplateOutlet],
  templateUrl: './app.html',
})
export class App {
  theme: Theme = 'dark';

  stateData = STATE_DATA;
  otherStates = Object.keys(STATE_NAMES)
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({ code, name: STATE_NAMES[code] }));

  selectedState = '';
  primaryDateInput = '';
  workupInput = '';
  ageInput = '';
  parsedDob: Date | null = null;
  parsedWorkup: Date | null = null;
  parsedIssueDate: Date | null = null;
  expMvrEnabled = false;
  expAgeEnabled = false;
  expAgeValue: number | null = null;
  storedDobValue = '';
  storedParsedDob: Date | null = null;
  yearsResult: ResultModel | null = null;
  calendarTarget: CalendarTarget | null = null;
  calYear = new Date().getFullYear();
  calMonth = new Date().getMonth();
  calTop = 0;
  calLeft = 0;

  premOldInput = '';
  premNewInput = '';
  premFeeInput = '';
  origOldPrem: number | null = null;
  origNewPrem: number | null = null;
  parsedOldPrem: number | null = null;
  parsedNewPrem: number | null = null;
  premOldDisplayIsNet = false;
  premNewDisplayIsNet = false;
  fixedFees: number[] = [];
  premResult: ResultModel | null = null;
  copiedText = signal('');
  private copyResetHandle: number | null = null;

  constructor() {
    const savedTheme = (localStorage.getItem('calcTheme') as Theme | null) || 'dark';
    this.setTheme(savedTheme);
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('calcTheme', theme);
  }

  stateName(code: string): string {
    if (code === 'MA') return 'Massachusetts';
    if (code === 'NC') return 'North Carolina';
    if (code === 'CA') return 'California';
    if (code === 'NJ') return 'New Jersey';
    if (code === 'DC') return 'Washington, D.C.';
    return STATE_NAMES[code] || '';
  }

  get selectedRule(): StateRule | null {
    return this.selectedState ? STATE_DATA[this.selectedState] : null;
  }

  get isExactState(): boolean {
    return EXACT_STATES.includes(this.selectedState);
  }

  get isNj(): boolean {
    return this.selectedState === 'NJ';
  }

  get canShowIssueDateOverride(): boolean {
    return true;
  }

  get modeLabel(): string {
    if (this.isExactState) return 'Exact calculation';
    if (this.isNj) return 'Months licensed (NJ)';
    return 'Range output';
  }

  get primaryDateLabel(): string {
    return this.expMvrEnabled ? 'Original DL Issue Date' : "Driver's Date of Birth";
  }

  get yearsReady(): boolean {
    const primaryOk = this.expMvrEnabled ? !!this.parsedIssueDate : !!this.parsedDob;
    return (
      !!this.selectedState &&
      primaryOk &&
      !!this.parsedWorkup &&
      (!this.expMvrEnabled || !!this.parsedIssueDate) &&
      (!this.expAgeEnabled || this.expAgeValue !== null)
    );
  }

  onStateChange(code: string): void {
    this.selectedState = code;
    this.yearsResult = null;
    this.updateExpPanels();
  }

  updateExpPanels(): void {
    if (this.canShowIssueDateOverride) return;
    if (this.expMvrEnabled) this.restoreDobMode();
    this.expMvrEnabled = false;
    this.expAgeEnabled = false;
    this.expAgeValue = null;
    this.ageInput = '';
    this.parsedIssueDate = null;
  }

  onPrimaryDateInput(input: HTMLInputElement): void {
    this.updateDateInput(input, input.value);
  }

  applyPrimaryDateInput(): void {
    this.applyDateValue(this.primaryDateInput, (value, parsed) => {
      this.primaryDateInput = value;
      if (this.expMvrEnabled) this.parsedIssueDate = parsed;
      else this.parsedDob = parsed;
    });
    this.syncDateInputElement('dobInput', this.primaryDateInput);
  }

  onWorkupInput(input: HTMLInputElement): void {
    this.updateDateInput(input, input.value);
  }

  applyWorkupInput(): void {
    this.applyDateValue(this.workupInput, (value, parsed) => {
      this.workupInput = value;
      this.parsedWorkup = parsed;
    });
    this.syncDateInputElement('workupInput', this.workupInput);
  }

  applyDateValue(value: string, setter: (value: string, parsed: Date | null) => void): void {
    const trimmed = value.trim();
    if (!trimmed) {
      setter('', null);
      return;
    }
    const parsed = this.parseDate(trimmed);
    setter(parsed ? this.formatDisplay(parsed) : trimmed, parsed);
  }

  toggleMvr(checked: boolean): void {
    if (checked) {
      if (this.expAgeEnabled) {
        this.expAgeEnabled = false;
        this.expAgeValue = null;
        this.ageInput = '';
      }
      this.expMvrEnabled = true;
      this.enableIssueDateMode();
    } else {
      this.expMvrEnabled = false;
      this.restoreDobMode();
    }
    this.yearsResult = null;
  }

  toggleAge(checked: boolean): void {
    if (checked) {
      if (this.expMvrEnabled) {
        this.expMvrEnabled = false;
        this.restoreDobMode();
      }
      this.expAgeEnabled = true;
    } else {
      this.expAgeEnabled = false;
      this.expAgeValue = null;
      this.ageInput = '';
    }
    this.yearsResult = null;
  }

  enableIssueDateMode(): void {
    this.storedDobValue = this.primaryDateInput;
    this.storedParsedDob = this.parsedDob;
    this.primaryDateInput = '';
    this.parsedDob = null;
    this.parsedIssueDate = null;
    this.syncDateInputElement('dobInput', '');
  }

  restoreDobMode(): void {
    this.primaryDateInput = this.storedDobValue;
    this.parsedDob = this.storedParsedDob;
    this.parsedIssueDate = null;
    this.syncDateInputElement('dobInput', this.primaryDateInput);
  }

  onAgeInput(value: string): void {
    this.ageInput = value;
    const parsed = parseFloat(value.trim());
    this.expAgeValue = !isNaN(parsed) && parsed > 0 && parsed < 100 ? parsed : null;
    this.yearsResult = null;
  }

  clearYears(): void {
    this.selectedState = '';
    this.primaryDateInput = '';
    this.workupInput = '';
    this.ageInput = '';
    this.parsedDob = null;
    this.parsedWorkup = null;
    this.parsedIssueDate = null;
    this.expMvrEnabled = false;
    this.expAgeEnabled = false;
    this.expAgeValue = null;
    this.storedDobValue = '';
    this.storedParsedDob = null;
    this.yearsResult = null;
    this.syncDateInputElement('dobInput', '');
    this.syncDateInputElement('workupInput', '');
  }

  calculateYears(): void {
    if (!this.yearsReady || !this.selectedRule || !this.parsedWorkup) return;
    const code = this.selectedState;
    const cfg = this.selectedRule;
    const workup = this.parsedWorkup;

    if (this.expMvrEnabled && this.parsedIssueDate) {
      if (workup < this.parsedIssueDate) {
        this.yearsResult = {
          tone: 'danger',
          icon: 'x',
          title: 'Workup date is before the issue date',
          bodyHtml: `The workup date (${this.fmtDate(workup)}) falls before the original DL issue date (${this.fmtDate(this.parsedIssueDate)}). Please verify both dates.`,
        };
      } else {
        this.yearsResult = this.renderLicensedOutput(
          code,
          this.parsedIssueDate,
          workup,
          'Years licensed',
          `Based on original DL issue date: ${this.fmtDate(this.parsedIssueDate)}`,
        );
      }
      return;
    }

    if (this.expAgeEnabled && this.expAgeValue !== null) {
      if (!this.parsedDob) {
        this.yearsResult = {
          tone: 'warn',
          icon: 'warn',
          title: 'Date of birth required',
          bodyHtml: `Please enter the driver's date of birth. It's needed to calculate years licensed from the reported age of <strong>${this.expAgeValue}</strong>.`,
        };
        return;
      }
      const enteredMonths = Math.round(this.expAgeValue * 12);
      if (enteredMonths < cfg.pM) {
        this.yearsResult = {
          tone: 'danger',
          icon: 'x',
          title: "Not yet eligible for a learner's permit",
          bodyHtml: `The entered age of <strong>${this.expAgeValue}</strong> is below the minimum permit age for ${this.stateName(code)} (age <strong>${cfg.pL}</strong>). Please verify the reported age.`,
        };
      } else if (enteredMonths < cfg.lM) {
        this.yearsResult = {
          tone: 'warn',
          icon: 'warn',
          title: "Learner's permit age only - not yet licensed",
          bodyHtml: `The entered age of <strong>${this.expAgeValue}</strong> falls within the learner's permit range for ${this.stateName(code)}. The minimum license age is <strong>${cfg.lL}</strong>.<br><br>Years licensed cannot be calculated from a permit-only age.`,
        };
      } else {
        const licenseDate = this.addMonths(this.parsedDob, enteredMonths);
        if (workup < licenseDate) {
          this.yearsResult = {
            tone: 'warn',
            icon: 'warn',
            title: 'Not yet licensed as of workup date',
            bodyHtml: `Based on the reported license age of ${this.expAgeValue}, this driver would not have been licensed until ${this.fmtDate(licenseDate)}.<br><br><strong style="color:var(--warn)">License eligible from: ${this.fmtDate(licenseDate)}</strong>`,
          };
        } else {
          this.yearsResult = this.renderLicensedOutput(
            code,
            licenseDate,
            workup,
            'Years licensed',
            `Based on reported first license age: ${this.expAgeValue} · Calculated license date: ${this.fmtDate(licenseDate)}`,
          );
        }
      }
      return;
    }

    const dob = this.parsedDob;
    if (!dob) return;
    if (this.isNj) {
      const bracket = this.getNJBracket(dob, workup, cfg);
      const permitDate = this.addMonths(dob, cfg.pM);
      const licenseDate = this.addMonths(dob, cfg.lM);
      if (bracket === null) {
        this.yearsResult = {
          tone: 'danger',
          icon: 'x',
          title: "Not yet eligible for a learner's permit",
          bodyHtml: `As of the workup date, this driver has not yet reached the minimum permit age in New Jersey (age ${cfg.pL}).<br><br><strong style="color:var(--danger)">Permit eligible from: ${this.fmtDate(permitDate)}</strong>`,
        };
      } else if (bracket === 'permit') {
        this.yearsResult = {
          tone: 'warn',
          icon: 'warn',
          title: "Learner's permit age only - not yet licensed",
          bodyHtml: `As of the workup date, this driver is old enough for a learner's permit in New Jersey but has not yet reached the minimum license age (${cfg.lL}).<br><br><strong style="color:var(--warn)">Regular license eligible from: ${this.fmtDate(licenseDate)}</strong>`,
        };
      } else {
        const diff = this.dateDiff(licenseDate, workup);
        this.yearsResult = {
          tone: 'success',
          icon: 'check',
          title: 'Months licensed',
          badge: bracket,
          copyText: this.formatNjClipboardText(bracket),
          meta: `License eligible from ${this.fmtDate(licenseDate)} · ${diff.years} yr ${diff.months} mo ${diff.days} d as of workup date`,
        };
      }
      return;
    }

    const licenseDate = this.addMonths(dob, cfg.lM);
    const permitDate = this.addMonths(dob, cfg.pM);
    if (workup >= licenseDate) {
      if (this.isExactState) {
        const diff = this.dateDiff(licenseDate, workup);
        this.yearsResult = {
          tone: 'success',
          icon: 'check',
          title: 'Years licensed',
          tileNum: diff.years,
          tileLabel: diff.years === 1 ? 'year' : 'years',
          copyText: String(diff.years),
          meta: `License eligible from ${this.fmtDate(licenseDate)} · ${diff.years} yr ${diff.months} mo ${diff.days} d as of workup date`,
        };
      } else {
        this.yearsResult = this.renderLicensedOutput(
          code,
          licenseDate,
          workup,
          'Years licensed',
          `License eligible from ${this.fmtDate(licenseDate)}`,
        );
      }
    } else if (workup >= permitDate) {
      this.yearsResult = {
        tone: 'warn',
        icon: 'warn',
        title: "Learner's permit age only - not yet licensed",
        bodyHtml: `As of the workup date, this driver is old enough for a learner's permit in ${this.stateName(code)} but has not yet reached the minimum age for a regular license.<br><br><strong style="color:var(--warn)">Regular license eligible from: ${this.fmtDate(licenseDate)}</strong>`,
      };
    } else {
      this.yearsResult = {
        tone: 'danger',
        icon: 'x',
        title: "Not yet eligible for a learner's permit",
        bodyHtml: `As of the workup date, this driver has not yet reached the minimum age for a learner's permit in ${this.stateName(code)}.<br><br><strong style="color:var(--danger)">Permit eligible from: ${this.fmtDate(permitDate)}</strong>`,
      };
    }
  }

  renderLicensedOutput(code: string, startDate: Date, workup: Date, title: string, meta: string): ResultModel {
    const diff = this.dateDiff(startDate, workup);
    if (code === 'NJ') {
      const badge = this.getNJElapsedRange(diff);
      return {
        tone: 'success',
        icon: 'check',
        title: 'Months licensed',
        badge,
        copyText: this.formatNjClipboardText(badge),
        meta: `${meta} · ${diff.years} yr ${diff.months} mo ${diff.days} d as of workup date`,
      };
    }
    if (EXACT_STATES.includes(code)) {
      return {
        tone: 'success',
        icon: 'check',
        title,
        tileNum: diff.years,
        tileLabel: diff.years === 1 ? 'year' : 'years',
        copyText: String(diff.years),
        meta: `${meta} · ${diff.years} yr ${diff.months} mo ${diff.days} d as of workup date`,
      };
    }
    const badge = this.getRange(diff);
    return {
      tone: 'success',
      icon: 'check',
      title,
      badge,
      copyText: this.formatRangeClipboardText(badge),
      meta: `${meta} · ${diff.years} yr ${diff.months} mo ${diff.days} d as of workup date`,
    };
  }

  syncAdjustedPremiums(updateDisplay = true): void {
    const total = this.fixedFeeTotal;
    this.parsedOldPrem = this.origOldPrem !== null ? this.origOldPrem - total : null;
    this.parsedNewPrem = this.origNewPrem !== null ? this.origNewPrem - total : null;
    if (updateDisplay) {
      if (this.origOldPrem !== null) {
        this.premOldInput = this.fmtCurrency(this.origOldPrem - total);
        this.premOldDisplayIsNet = true;
      }
      if (this.origNewPrem !== null) {
        this.premNewInput = this.fmtCurrency(this.origNewPrem - total);
        this.premNewDisplayIsNet = true;
      }
    }
  }

  onPremiumInput(kind: 'old' | 'new', value: string): void {
    const parsed = this.parseCurrency(value);
    if (kind === 'old') {
      this.premOldInput = value;
      this.origOldPrem = parsed;
      this.premOldDisplayIsNet = false;
    } else {
      this.premNewInput = value;
      this.origNewPrem = parsed;
      this.premNewDisplayIsNet = false;
    }
    this.syncAdjustedPremiums(false);
    this.premResult = null;
  }

  applyPremiumInput(kind: 'old' | 'new'): void {
    const value = kind === 'old' ? this.premOldInput : this.premNewInput;
    const isNet = kind === 'old' ? this.premOldDisplayIsNet : this.premNewDisplayIsNet;
    const parsed = this.parseCurrency(value);
    const orig = parsed !== null ? (isNet ? parsed + this.fixedFeeTotal : parsed) : null;
    const prev = kind === 'old' ? this.origOldPrem : this.origNewPrem;
    if (kind === 'old') this.origOldPrem = orig;
    else this.origNewPrem = orig;
    this.syncAdjustedPremiums();
    if (orig !== prev) this.premResult = null;
  }

  guardDateKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) return;
    const input = event.target as HTMLInputElement;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;

    if (['Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
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
      this.applyDateInputDeletion(input, deleteIndex);
      if (event.key === 'Delete') input.setSelectionRange(selectionStart, selectionStart);
      return;
    }

    if (!/\d/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const selectedText = input.value.slice(selectionStart, selectionEnd);
    const currentDigitCount = input.value.replace(/\D/g, '').length;
    const selectedDigitCount = selectedText.replace(/\D/g, '').length;
    if (currentDigitCount - selectedDigitCount >= 8) {
      event.preventDefault();
    }
  }

  private applyDateInputDeletion(input: HTMLInputElement, deleteIndex: number): void {
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBefore = input.value.slice(0, cursor).replace(/\D/g, '').length;
    const deletedDigit = /\d/.test(input.value[deleteIndex]);
    const newDigitsBefore = deletedDigit && deleteIndex < cursor ? digitsBefore - 1 : digitsBefore;
    const newValue = input.value.slice(0, deleteIndex) + input.value.slice(deleteIndex + 1);
    this.updateDateInput(input, newValue, newDigitsBefore);
  }

  private updateDateInput(input: HTMLInputElement, value: string, digitsBeforeCursor?: number): void {
    const cursor = input.selectionStart ?? value.length;
    const digitsBefore = digitsBeforeCursor ?? value.slice(0, cursor).replace(/\D/g, '').length;
    const formatted = this.formatDateInput(value);

    if (input.id === 'dobInput') {
      this.primaryDateInput = formatted;
      const parsed = this.isCompleteDateInput(formatted) ? this.parseDate(formatted) : null;
      if (this.expMvrEnabled) this.parsedIssueDate = parsed;
      else this.parsedDob = parsed;
    } else if (input.id === 'workupInput') {
      this.workupInput = formatted;
      this.parsedWorkup = this.isCompleteDateInput(formatted) ? this.parseDate(formatted) : null;
    }

    this.yearsResult = null;
    const newCursor = this.getDateInputCursorPosition(formatted, digitsBefore);
    input.value = formatted;
    input.setSelectionRange(newCursor, newCursor);
  }

  private syncDateInputElement(inputId: 'dobInput' | 'workupInput', value: string): void {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (input) input.value = value;
  }

  private getDateInputCursorPosition(formatted: string, digitsBefore: number): number {
    if (digitsBefore <= 0) return 0;

    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        count++;
        if (count === digitsBefore) {
          const pos = i + 1;
          if ((digitsBefore === 2 || digitsBefore === 4) && formatted[pos] === '/') return pos + 1;
          return pos;
        }
      }
    }

    return formatted.length;
  }

  guardDecimalKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) return;
    if (['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    if (!/[\d.]/.test(event.key)) event.preventDefault();
  }

  guardDecimalPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = this.sanitizeDecimalText(event.clipboardData?.getData('text') ?? '');
    if (!pasted) return;

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const value = this.sanitizeDecimalText(input.value.slice(0, start) + pasted + input.value.slice(end));
    const cursor = Math.min(start + pasted.length, value.length);

    input.value = value;
    input.setSelectionRange(cursor, cursor);

    if (input.id === 'premOldInput') this.onPremiumInput('old', value);
    else if (input.id === 'premNewInput') this.onPremiumInput('new', value);
    else if (input.id === 'premFeeInput') this.onFeeInput(value);
  }

  private sanitizeDecimalText(value: string): string {
    const cleaned = value.replace(/[^\d.]/g, '');
    const [whole, ...fraction] = cleaned.split('.');
    if (fraction.length === 0) return whole;
    return `${whole}.${fraction.join('')}`;
  }

  onFeeInput(value: string): void {
    this.premFeeInput = value;
  }

  addFixedFee(): boolean {
    const fee = this.parseCurrency(this.premFeeInput);
    if (fee === null) return false;
    const newTotal = this.fixedFeeTotal + fee;
    const adjOld = this.origOldPrem !== null ? this.origOldPrem - newTotal : null;
    const adjNew = this.origNewPrem !== null ? this.origNewPrem - newTotal : null;
    if ((adjOld !== null && adjOld <= 0) || (adjNew !== null && adjNew < 0)) {
      this.premResult = {
        tone: 'warn', icon: 'warn',
        title: 'Fixed fee exceeds premium',
        bodyHtml: `Adding a fee of <strong>$${this.fmtCurrency(fee)}</strong> would leave an adjusted old premium of <strong>$${adjOld !== null ? this.fmtCurrency(adjOld) : '-'}</strong> and adjusted new premium of <strong>$${adjNew !== null ? this.fmtCurrency(adjNew) : '-'}</strong>. Please verify the fee.`,
      };
      return false;
    }
    this.fixedFees.push(fee);
    this.premFeeInput = '';
    this.syncAdjustedPremiums();
    this.premResult = null;
    return true;
  }

  removeFixedFee(index: number): void {
    this.fixedFees.splice(index, 1);
    this.syncAdjustedPremiums();
    this.premResult = null;
  }

  clearPremium(): void {
    this.premOldInput = '';
    this.premNewInput = '';
    this.premFeeInput = '';
    this.origOldPrem = null;
    this.origNewPrem = null;
    this.parsedOldPrem = null;
    this.parsedNewPrem = null;
    this.premOldDisplayIsNet = false;
    this.premNewDisplayIsNet = false;
    this.fixedFees = [];
    this.premResult = null;
  }

  get premiumReady(): boolean {
    return this.parsedOldPrem !== null && this.parsedOldPrem > 0
        && this.parsedNewPrem !== null && this.parsedNewPrem >= 0;
  }

  get fixedFeeTotal(): number {
    return this.fixedFees.reduce((sum, fee) => sum + fee, 0);
  }

  calculatePremium(): void {
    if (this.parseCurrency(this.premFeeInput) !== null && !this.addFixedFee()) return;
    if (!this.premiumReady || this.parsedOldPrem === null || this.parsedOldPrem <= 0 || this.parsedNewPrem === null || this.parsedNewPrem < 0) return;
    const totalFees = this.fixedFeeTotal;
    const rawPct = (this.parsedNewPrem / this.parsedOldPrem - 1) * 100;
    const pct = Math.round(rawPct * 10) / 10;
    const sign = pct > 0 ? '+' : '';
    const meta = `$${this.fmtCurrency(this.parsedOldPrem)} → $${this.fmtCurrency(this.parsedNewPrem)}`;
    const extraMeta = totalFees > 0 ? `Fixed fees excluded: $${this.fmtCurrency(totalFees)}` : undefined;
    if (pct > 0) {
      const copyText = this.formatPremiumClipboardText(this.parsedOldPrem, this.parsedNewPrem, pct);
      this.premResult = {
        tone: 'success',
        icon: 'up',
        title: 'Premium increase',
        copyText,
        premiumPct: `${sign}${pct.toFixed(1)}%`,
        premiumClass: 'increase',
        meta,
        extraMeta,
      };
    } else if (pct < 0) {
      this.premResult = {
        tone: 'danger',
        icon: 'down',
        title: 'Premium decrease',
        premiumPct: `${pct.toFixed(1)}%`,
        premiumClass: 'decrease',
        meta,
        extraMeta,
      };
    } else {
      this.premResult = {
        tone: 'warn',
        icon: 'flat',
        title: 'No change',
        premiumPct: '0.0%',
        premiumClass: 'flat',
        meta,
        extraMeta,
      };
    }
  }

  copyResult(text: string, event: Event): void {
    const button = event.currentTarget as HTMLButtonElement;

    this.copiedText.set(text);
    if (this.copyResetHandle !== null) window.clearTimeout(this.copyResetHandle);
    this.copyResetHandle = window.setTimeout(() => {
      if (this.copiedText() === text) this.copiedText.set('');
      this.copyResetHandle = null;
      button.blur();
    }, 2000);

    button.blur();
    void this.writeClipboardText(text);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.calendarTarget) return;
    const popup = document.getElementById('calPopup');
    if (popup?.contains(event.target as Node)) return;
    if ((event.target as Element).closest?.('.cal-icon-btn')) return;
    this.closeCalendar();
  }

  openCalendar(target: CalendarTarget, input: HTMLInputElement): void {
    if (this.calendarTarget === target) {
      this.closeCalendar();
      return;
    }
    this.calendarTarget = target;
    const current = this.parseDate(input.value);
    if (current) {
      this.calYear = current.getFullYear();
      this.calMonth = current.getMonth();
    } else {
      const now = new Date();
      this.calYear = now.getFullYear();
      this.calMonth = now.getMonth();
    }
    const rect = input.getBoundingClientRect();
    const popW = 268;
    const popH = 316;
    let top = rect.bottom + 6;
    let left = rect.left;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (top + popH > window.innerHeight - 8) top = rect.top - popH - 6;
    this.calTop = top;
    this.calLeft = left;
  }

  closeCalendar(): void {
    this.calendarTarget = null;
  }

  changeCalendarMonth(delta: number): void {
    this.calMonth += delta;
    if (this.calMonth < 0) {
      this.calMonth = 11;
      this.calYear--;
    } else if (this.calMonth > 11) {
      this.calMonth = 0;
      this.calYear++;
    }
  }

  changeCalendarYear(delta: number): void {
    this.calYear += delta;
  }

  calendarBlanks(): number[] {
    return Array.from({ length: new Date(this.calYear, this.calMonth, 1).getDay() }, (_, i) => i);
  }

  calendarDays(): number[] {
    const days = new Date(this.calYear, this.calMonth + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  }

  calendarLabel(): string {
    return `${this.months[this.calMonth]} ${this.calYear}`;
  }

  isCalendarToday(day: number): boolean {
    const now = new Date();
    return now.getFullYear() === this.calYear && now.getMonth() === this.calMonth && now.getDate() === day;
  }

  isCalendarSelected(day: number): boolean {
    const selected = this.calendarTarget === 'primary'
      ? this.parseDate(this.primaryDateInput)
      : this.parseDate(this.workupInput);
    return !!selected && selected.getFullYear() === this.calYear && selected.getMonth() === this.calMonth && selected.getDate() === day;
  }

  selectCalendarDay(day: number): void {
    const picked = new Date(this.calYear, this.calMonth, day, 12, 0, 0);
    const target = this.calendarTarget;
    if (target === 'primary') {
      this.primaryDateInput = this.formatDisplay(picked);
      if (this.expMvrEnabled) this.parsedIssueDate = picked;
      else this.parsedDob = picked;
      this.syncDateInputElement('dobInput', this.primaryDateInput);
    } else if (target === 'workup') {
      this.workupInput = this.formatDisplay(picked);
      this.parsedWorkup = picked;
      this.syncDateInputElement('workupInput', this.workupInput);
    }
    this.yearsResult = null;
    this.closeCalendar();
  }

  months = [
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

  parseCurrency(str: string): number | null {
    if (!str || !str.trim()) return null;
    const val = parseFloat(str.replace(/[$,\s]/g, ''));
    return isNaN(val) || val <= 0 ? null : val;
  }

  fmtCurrency(val: number): string {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatClipboardCurrency(val: number): string {
    const roundedCents = Math.round(Math.abs(val) * 100) % 100;
    return val.toLocaleString('en-US', {
      minimumFractionDigits: roundedCents === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }

  formatPremiumClipboardText(oldPrem: number, newPrem: number, pct: number): string {
    return [
      `Old premium: $${this.formatClipboardCurrency(oldPrem)}`,
      `New premium: $${this.formatClipboardCurrency(newPrem)}`,
      `% Difference: ${this.formatClipboardPercent(pct)}%`,
    ].join('\n');
  }

  formatClipboardPercent(pct: number): string {
    return pct.toFixed(1);
  }

  formatRangeClipboardText(label: string): string {
    return label
      .replace(/\s*[\u2013-]\s*/g, '-')
      .replace(/\s+years?$/i, '')
      .toLowerCase();
  }

  formatNjClipboardText(label: string): string {
    return label.replace(/\s*[\u2013-]\s*/g, '-');
  }

  private async writeClipboardText(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return this.writeClipboardTextFallback(text);
      }
    }

    return this.writeClipboardTextFallback(text);
  }

  private writeClipboardTextFallback(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  parseDate(str: string): Date | null {
    if (!str) return null;
    const trimmed = str.trim();
    let m: string | undefined;
    let d: string | undefined;
    let y: string | undefined;
    let match = trimmed.match(/^(\d{4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})$/);
    if (match) [, y, m, d] = match;
    if (!y) {
      match = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{4})$/);
      if (match) [, m, d, y] = match;
    }
    if (!y) {
      match = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2})$/);
      if (match) {
        [, m, d, y] = match;
        y = `${parseInt(y, 10) <= 30 ? '20' : '19'}${y}`;
      }
    }
    if (!y) {
      match = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
      if (match) [, m, d, y] = match;
    }
    if (!m || !d || !y) return null;
    const date = new Date(`${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00`);
    return isNaN(date.getTime()) ? null : date;
  }

  formatDateInput(value: string): string {
    const parts = value.split('/');
    const rawMonth = (parts[0] ?? '').replace(/\D/g, '');
    const rawDay = (parts[1] ?? '').replace(/\D/g, '');
    const rawYear = parts.slice(2).join('').replace(/\D/g, '');

    const month = rawMonth.slice(0, 2);
    const dayDigits = rawMonth.slice(2) + rawDay;
    const day = dayDigits.slice(0, 2);
    const yearDigits = dayDigits.slice(2) + rawYear;
    const year = yearDigits.slice(0, 4);

    let formatted = month;
    if (month.length === 2 || day || year) formatted += `/${day}`;
    if (day.length === 2 || year) formatted += `/${year}`;
    return formatted;
  }

  isCompleteDateInput(value: string): boolean {
    return value.replace(/\D/g, '').length === 8;
  }

  formatDisplay(date: Date): string {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  }

  fmtDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) d.setDate(0);
    return d;
  }

  dateDiff(from: Date, to: Date): Diff {
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    if (days < 0) {
      months--;
      days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return { years, months, days };
  }

  getRange(diff: Diff): string {
    const m = diff.years * 12 + diff.months;
    if (m < 12) return 'Less than 1 year';
    if (m < 24) return '1 – 2 years';
    if (m < 36) return '2 – 3 years';
    return 'More than 3 years';
  }

  getNJElapsedRange(diff: Diff): string {
    const m = diff.years * 12 + diff.months;
    if (m < 6) return '0 – 6 months';
    if (m < 12) return '7 – 12 months';
    if (m < 18) return '13 – 18 months';
    if (m < 24) return '19 – 24 months';
    if (m < 30) return '25 – 30 months';
    if (m < 36) return '31 – 35 months';
    return 'More than 36 months';
  }

  getNJBracket(dob: Date, workup: Date, cfg: StateRule): string | null {
    const permitDate = this.addMonths(dob, cfg.pM);
    const licenseDate = this.addMonths(dob, cfg.lM);
    if (workup < permitDate) return null;
    if (workup < licenseDate) return 'permit';
    return this.getNJElapsedRange(this.dateDiff(licenseDate, workup));
  }
}
