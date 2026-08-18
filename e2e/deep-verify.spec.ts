import { test, expect } from '@playwright/test';

function fmt(d: Date) {
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
}

const TODAY = fmt(new Date());

async function fill(page: import('@playwright/test').Page, state: string, dob: string, workup = TODAY) {
  await page.selectOption('#stateSelect', state);
  await page.fill('#dobInput', dob);
  await page.fill('#workupInput', workup);
  await page.click('.years-card .btn');
}

test.describe('Deep calculator audit', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  // ── NJ DOB path: all bracket boundaries ────────────────────────────────
  test('NJ bug case: 9/17/2007 workup 9/27/2026 → 13–18 months', async ({ page }) => {
    await fill(page, 'NJ', '09/17/2007', '09/27/2026');
    await expect(page.locator('.range-badge')).toHaveText('13 – 18 months');
  });

  test('NJ: 9 days licensed → 0–6 months', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2007', '01/10/2025');
    await expect(page.locator('.range-badge')).toHaveText('0 – 6 months');
  });

  test('NJ: 6mo 9d licensed → 7–12 months', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2007', '07/10/2025');
    await expect(page.locator('.range-badge')).toHaveText('7 – 12 months');
  });

  test('NJ: 12mo 9d licensed → 13–18 months', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2007', '01/10/2026');
    await expect(page.locator('.range-badge')).toHaveText('13 – 18 months');
  });

  test('NJ: 18mo 9d licensed → 19–24 months', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2007', '07/10/2026');
    await expect(page.locator('.range-badge')).toHaveText('19 – 24 months');
  });

  test('NJ: 24mo 9d licensed → 25–30 months', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2007', '01/10/2027');
    await expect(page.locator('.range-badge')).toHaveText('25 – 30 months');
  });

  test('NJ: 30mo 9d licensed → 31–35 months', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2007', '07/10/2027');
    await expect(page.locator('.range-badge')).toHaveText('31 – 35 months');
  });

  test('NJ: 36mo 9d licensed → More than 36 months', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2007', '01/10/2028');
    await expect(page.locator('.range-badge')).toHaveText('More than 36 months');
  });

  test('NJ: 30-year-old → More than 36 months', async ({ page }) => {
    const dob = fmt(new Date(new Date().setFullYear(new Date().getFullYear() - 30)));
    await fill(page, 'NJ', dob);
    await expect(page.locator('.range-badge')).toHaveText('More than 36 months');
  });

  test('NJ: permit only (age 16.5) → permit warning', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2007', '06/15/2023');
    await expect(page.locator('.result-title')).toContainText("Learner's permit age only");
  });

  test('NJ: not yet permit eligible (<16) → danger', async ({ page }) => {
    await fill(page, 'NJ', '01/01/2010', '06/15/2023');
    await expect(page.locator('.result-title')).toContainText("Not yet eligible for a learner's permit");
  });

  // ── Standard range-bracket states ────────────────────────────────────────
  // DOB 1/1/2000, TX license 16 → license 1/1/2016, workup 1/1/2025 → 9yr
  test('TX: 9yr → More than 3 years', async ({ page }) => {
    await fill(page, 'TX', '01/01/2000', '01/01/2025');
    await expect(page.locator('.range-badge')).toHaveText('More than 3 years');
  });

  // DOB 1/1/2007, TX license 16 → license 1/1/2023, workup 3/1/2024 → 1y2m
  test('TX: 1y2m licensed → 1–2 years', async ({ page }) => {
    await fill(page, 'TX', '01/01/2007', '03/01/2024');
    await expect(page.locator('.range-badge')).toHaveText('1 – 2 years');
  });

  test('TX: 2y5m licensed → 2–3 years', async ({ page }) => {
    await fill(page, 'TX', '01/01/2007', '06/01/2025');
    await expect(page.locator('.range-badge')).toHaveText('2 – 3 years');
  });

  test('TX: 4mo licensed → Less than 1 year', async ({ page }) => {
    await fill(page, 'TX', '01/01/2007', '05/01/2023');
    await expect(page.locator('.range-badge')).toHaveText('Less than 1 year');
  });

  test('TX: permit only (15y5m) → permit warning', async ({ page }) => {
    await fill(page, 'TX', '01/01/2009', '06/01/2024');
    await expect(page.locator('.result-title')).toContainText("Learner's permit age only");
  });

  test('TX: under permit age (14y5m) → not eligible', async ({ page }) => {
    await fill(page, 'TX', '01/01/2010', '06/01/2024');
    await expect(page.locator('.result-title')).toContainText("Not yet eligible for a learner's permit");
  });

  // ── Exact states (show numeric tile) ─────────────────────────────────────
  test('MA: license 16.5, 8.5yr → tile "8"', async ({ page }) => {
    await fill(page, 'MA', '01/01/2000', '01/01/2025');
    await expect(page.locator('.tile-num')).toHaveText('8');
  });

  test('MA: permit only (16y3m, not yet 16.5) → permit warning', async ({ page }) => {
    await fill(page, 'MA', '01/01/2007', '04/01/2023');
    await expect(page.locator('.result-title')).toContainText("Learner's permit age only");
  });

  // DOB 1/1/1984, NC license 16 → license 1/1/2000, workup 1/1/2025 → 25yr
  test('NC: 25yr → tile "25"', async ({ page }) => {
    await fill(page, 'NC', '01/01/1984', '01/01/2025');
    await expect(page.locator('.tile-num')).toHaveText('25');
  });

  // DOB 1/1/1984, CA license 16 → license 1/1/2000, workup 7/1/2025 → 25y6m → tile 25
  test('CA: 25yr → tile "25"', async ({ page }) => {
    await fill(page, 'CA', '01/01/1984', '07/01/2025');
    await expect(page.locator('.tile-num')).toHaveText('25');
  });

  // ── Unusual license ages ──────────────────────────────────────────────────
  test('MT: license 15, 10yr → More than 3 years', async ({ page }) => {
    await fill(page, 'MT', '01/01/2007', '01/01/2025');
    await expect(page.locator('.range-badge')).toHaveText('More than 3 years');
  });

  // DOB 1/1/2000, PA license 16.5 → license 7/1/2016, workup 1/1/2025 → 8y6m
  test('PA: license 16.5, 8y6m → More than 3 years', async ({ page }) => {
    await fill(page, 'PA', '01/01/2000', '01/01/2025');
    await expect(page.locator('.range-badge')).toHaveText('More than 3 years');
  });

  test('VA: license 16y3m, 2y3m → 2–3 years', async ({ page }) => {
    // DOB 1/1/2007, license date 4/1/2023, workup 7/1/2025 → 2y3m
    await fill(page, 'VA', '01/01/2007', '07/01/2025');
    await expect(page.locator('.range-badge')).toHaveText('2 – 3 years');
  });

  // DOB 1/1/2000, AK license 16 → license 1/1/2016, workup 1/1/2025 → 9yr
  test('AK: permit 14, license 16, 9yr → More than 3 years', async ({ page }) => {
    await fill(page, 'AK', '01/01/2000', '01/01/2025');
    await expect(page.locator('.range-badge')).toHaveText('More than 3 years');
  });

  // DOB 1/1/2000, DE license 16 → license 1/1/2016, workup 1/1/2025 → 9yr
  test('DE: permit 15y10m, license 16, 9yr → More than 3 years', async ({ page }) => {
    await fill(page, 'DE', '01/01/2000', '01/01/2025');
    await expect(page.locator('.range-badge')).toHaveText('More than 3 years');
  });

  // DOB 1/1/2000, MD license 18 → license 1/1/2018, workup 1/1/2025 → 7yr
  test('MD: permit 15y9m, license 18, 7yr → More than 3 years', async ({ page }) => {
    await fill(page, 'MD', '01/01/2000', '01/01/2025');
    await expect(page.locator('.range-badge')).toHaveText('More than 3 years');
  });
});
