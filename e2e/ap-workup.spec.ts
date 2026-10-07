import { test, expect } from '@playwright/test';

// ── Date helpers ──────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

/** Return a date N years (and optional extra months) before today. */
function dobAgo(years: number, extraMonths = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(d.getMonth() - extraMonths);
  return fmt(d);
}

const TODAY = fmt(new Date());

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fillYearsCalc(
  page: import('@playwright/test').Page,
  state: string,
  dob: string,
  workup = TODAY,
) {
  await page.selectOption('#stateSelect', state);
  await page.fill('#dobInput', dob);
  await page.fill('#workupInput', workup);
  // Clicking calculate also blurs workupInput, which completes the date before it is read.
  await page.click('.years-card .btn');
}

async function fillPremiumCalc(
  page: import('@playwright/test').Page,
  oldPrem: string,
  newPrem: string,
) {
  await page.fill('#premOldInput', oldPrem);
  await page.fill('#premNewInput', newPrem);
  await page.click('.premium-card .btn');
}

// ─────────────────────────────────────────────────────────────────────────────
//  YEARS LICENSED CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Years Licensed Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Test 1: 35-year-old in TX shows "More than 3 years"', async ({ page }) => {
    // TX: license age 16. 35 - 16 = 19 years licensed → "More than 3 years"
    await fillYearsCalc(page, 'TX', dobAgo(35));
    await expect(page.locator('.range-badge')).toBeVisible();
    await expect(page.locator('.range-badge')).toHaveText('More than 3 years');
  });

  test('Test 2: 16-year-old new driver in TX shows "Less than 1 year"', async ({ page }) => {
    // DOB 16y 3m ago → just crossed license age → ~3 months licensed → "Less than 1 year"
    await fillYearsCalc(page, 'TX', dobAgo(16, 3));
    await expect(page.locator('.range-badge')).toBeVisible();
    await expect(page.locator('.range-badge')).toHaveText('Less than 1 year');
  });

  test('Test 3: Under driving age in TX shows permit-ineligible warning', async ({ page }) => {
    // DOB 14 years ago → TX permit age 15 → not yet eligible
    await fillYearsCalc(page, 'TX', dobAgo(14));
    await expect(page.locator('.result')).toBeVisible();
    await expect(page.locator('.result-title')).toContainText(
      "Not yet eligible for a learner's permit",
    );
  });

  test('Test 4: Massachusetts shows an exact year count (tile)', async ({ page }) => {
    // MA is an exact-calculation state - result shows a numeric tile, not a range badge
    await fillYearsCalc(page, 'MA', dobAgo(30));
    await expect(page.locator('.tile-num')).toBeVisible();
    await expect(page.locator('.tile-num')).toContainText(/^\d+$/);
  });

  test('Test 5: New Jersey shows a month-bracket result', async ({ page }) => {
    // NJ uses an age-bracket format (e.g. "More than 36 months")
    await fillYearsCalc(page, 'NJ', dobAgo(30));
    await expect(page.locator('.range-badge')).toBeVisible();
    await expect(page.locator('.range-badge')).toContainText('months');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PREMIUM WORKUP CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Premium Workup Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Test 6: $1,000 → $1,200 shows +20.0% increase', async ({ page }) => {
    await fillPremiumCalc(page, '1000', '1200');
    await expect(page.locator('.result-title')).toContainText('Premium increase');
    await expect(page.locator('.prem-pct')).toContainText('+20.0%');
  });

  test('Test 7: $1,000 → $800 shows −20.0% decrease', async ({ page }) => {
    await fillPremiumCalc(page, '1000', '800');
    await expect(page.locator('.result-title')).toContainText('Premium decrease');
    await expect(page.locator('.prem-pct')).toContainText('-20.0%');
  });

  test('Test 8: $1,000 → $1,000 shows no change', async ({ page }) => {
    await fillPremiumCalc(page, '1000', '1000');
    await expect(page.locator('.result-title')).toContainText('No change');
    await expect(page.locator('.prem-pct')).toContainText('0.0%');
  });

  test('Test 9: Clear button empties fields and removes result', async ({ page }) => {
    await fillPremiumCalc(page, '1000', '1200');
    await expect(page.locator('.result')).toBeVisible();

    await page.click('.premium-card .btn-clear');

    await expect(page.locator('#premOldInput')).toHaveValue('');
    await expect(page.locator('#premNewInput')).toHaveValue('');
    await expect(page.locator('.result')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  THEMES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Theme toggle', () => {
  test('Test 10: Theme buttons switch between light, dark, and original', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    await page.click('.theme-btn[aria-label="Light mode"]');
    expect(await html.getAttribute('data-theme')).toBe('light');

    await page.click('.theme-btn[aria-label="Dark mode"]');
    expect(await html.getAttribute('data-theme')).toBe('dark');

    await page.click('.theme-btn[aria-label="Original spreadsheet theme"]');
    expect(await html.getAttribute('data-theme')).toBe('original');
  });

  test('Test 11: Original theme premium table fills results as cells are left', async ({
    page,
  }) => {
    await page.goto('/');
    await page.click('.theme-btn[aria-label="Original spreadsheet theme"]');

    await page.fill('input[aria-label="Old premium, row 1"]', '700');
    await page.fill('input[aria-label="New premium, row 1"]', '800');
    await page.keyboard.press('Tab');

    const row = page.locator('.xl-row').first();
    await expect(row.locator('.xl-out').first()).toHaveText('100.00');
    await expect(row.locator('.xl-pct')).toContainText('+14.3%');
    await expect(page.locator('.xl-detail')).toContainText('Premium increase');

    await page.fill('input[aria-label="Fixed fee, row 1"]', '25');
    await page.keyboard.press('Enter');

    await expect(row.locator('.xl-chip')).toContainText('25.00');
    await expect(row.locator('.xl-pct')).toContainText('+14.8%');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GENERAL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('General', () => {
  test('Test 12: Both calculator headings are visible on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Years Licensed Calculator')).toBeVisible();
    await expect(page.getByText('Premium Workup Calculator')).toBeVisible();
  });
});
