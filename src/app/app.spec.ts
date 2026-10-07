import { ComponentFixture, TestBed } from '@angular/core/testing';
import { domOf, installStorageMock } from '../testing/dom';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let dom: ReturnType<typeof domOf<App>>;

  const grid = (): DOMTokenList => dom.get('.page-grid').classList;

  function calculateYears(): void {
    dom.select('#stateSelect', 'MA');
    dom.typeInto('#dobInput', '01/01/1990');
    dom.typeInto('#workupInput', '01/01/2024');
    dom.click('.years-card .btn');
  }

  function calculatePremium(oldPremium: string, newPremium: string): void {
    dom.typeInto('#premOldInput', oldPremium);
    dom.typeInto('#premNewInput', newPremium);
    dom.click('.premium-card .btn');
  }

  beforeEach(() => {
    installStorageMock();
    document.documentElement.removeAttribute('data-theme');
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    dom = domOf(fixture);
  });

  it('renders both calculator headings', () => {
    expect(dom.root.textContent).toContain('Years Licensed Calculator');
    expect(dom.root.textContent).toContain('Premium Workup Calculator');
  });

  it('switches theme from the toggle and marks the active button', () => {
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(dom.get('.theme-btn[aria-label="Dark mode"]').classList.contains('active')).toBe(true);

    dom.click('.theme-btn[aria-label="Light mode"]');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(dom.get('.theme-btn[aria-label="Light mode"]').classList.contains('active')).toBe(true);
    expect(dom.get('.theme-btn[aria-label="Dark mode"]').classList.contains('active')).toBe(false);
  });

  it('shows the table in place of the premium form and keeps the years card', () => {
    dom.click('.theme-btn[aria-label="Original spreadsheet theme"]');

    expect(dom.query('.xl-table')).not.toBeNull();
    expect(dom.query('#premOldInput')).toBeNull();
    expect(dom.query('.years-card #stateSelect')).not.toBeNull();
  });

  it('offers the all-caps copy button only on the premium result', () => {
    calculateYears();

    expect(dom.text('.tile-num')).toBe('17');
    expect(dom.text('.tile-lbl')).toBe('years');
    expect(dom.all('.result-copy-btn').length).toBe(1);
    expect(dom.query('.result-secret-btn')).toBeNull();

    calculatePremium('100', '200');

    expect(dom.all('.result-copy-btn').length).toBe(2);
    expect(dom.all('.result-secret-btn').length).toBe(1);
    expect(dom.query('.premium-stack .result-secret-btn')).not.toBeNull();
  });

  it('keeps each result card as a direct child of the element the layout rules expect', () => {
    calculateYears();
    calculatePremium('100', '200');

    expect(dom.all('.page-grid > .calc-column').length).toBe(2);
    expect(dom.query('.calc-column > .result.success .tile-num')).not.toBeNull();
    expect(dom.query('.premium-stack > .card.premium-card')).not.toBeNull();
    expect(dom.query('.premium-stack > .result.success .prem-pct')).not.toBeNull();
  });

  it('pairs the result cards only while both calculators show one', () => {
    expect(grid().contains('page-grid--paired')).toBe(false);

    calculateYears();
    expect(grid().contains('page-grid--paired')).toBe(false);

    calculatePremium('100', '200');
    expect(grid().contains('page-grid--paired')).toBe(true);

    dom.click('.premium-card .btn-clear');
    expect(grid().contains('page-grid--paired')).toBe(false);
  });

  it('makes room in the layout while the age override is open', () => {
    expect(grid().contains('page-grid--years-age-expanded')).toBe(false);

    dom.click('#agePanel input[type="checkbox"]');
    expect(grid().contains('page-grid--years-age-expanded')).toBe(true);

    dom.click('#agePanel input[type="checkbox"]');
    expect(grid().contains('page-grid--years-age-expanded')).toBe(false);
  });
});
