[![CI](https://github.com/markwaldron7string/ap-workup-angular/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/markwaldron7string/ap-workup-angular/actions/workflows/ci.yml)
[![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://ap-workup-angular.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# AP Workup Tool

Insurance workup calculators for quickly checking driver experience and premium changes during underwriting or remarketing reviews.

**Live demo:** [ap-workup-angular.vercel.app](https://ap-workup-angular.vercel.app/)

![AP Workup Tool screenshot](public/workuptool.png)

## Calculators

### Years Licensed Calculator

Calculates years licensed using the driver's date of birth, workup date (quote date), and state-specific permit/license age rules.

Supports:

- Exact calculation states: Massachusetts, North Carolina, California
- New Jersey month-bracket output
- Range output for other states
- Optional age-first-licensed override
- Optional original DL issue date override for supported states
- One-click copy button on each result card

### Premium Workup Calculator

Calculates percentage change between old and new premium values.

Supports:

- Premium increase, decrease, and flat-change output
- Fixed fee exclusions
- Clear/reset behavior
- One-click copy button on each result card - copies the result to the clipboard in a clean plain-text format
- Light, dark, and original (retro spreadsheet-styled) theme toggle that persists: user's preference remains after user closes the app and returns.

### Original (Spreadsheet) Theme

A throwback to the Excel workbook this app replaces.

- Years Licensed keeps the same card as the other themes, restyled with yellow input cells and a green result box
- Premium Workup becomes the original table: example rows, "TYPE NEW DATA" rows, yellow input columns, and green result columns for Change Amount and % Change
- Results fill in when you leave a cell or press Enter - there is no Calculate button in the table
- Arrow keys move between cells
- Fixed fees are added per row with Enter or the + button and removed with ×
- The bar under the table shows the selected row's breakdown and warnings, with Clear row, Clear all, and Copy
- Rows are not saved: they reset on page reload and are separate from the premium form in the light and dark themes
- On narrow screens the selected row is shown one field per line with Prev/Next

## Tech Stack

- Angular 21
- TypeScript
- pnpm
- Vitest
- jsdom
- Playwright
- GitHub Actions

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the local development server:

```bash
pnpm start
```

Then open:

```text
http://localhost:4200/
```

## Available Scripts

Run the app locally:

```bash
pnpm start
```

Build for production:

```bash
pnpm build
```

Run unit tests in watch mode:

```bash
pnpm test
```

Run unit tests once for CI:

```bash
pnpm test:ci
```

Run unit tests once with a coverage report:

```bash
pnpm test:coverage
```

Run end-to-end tests (the app must already be running on `http://localhost:4200`):

```bash
pnpm test:e2e
```

Run end-to-end tests in Playwright's interactive UI:

```bash
pnpm test:e2e:ui
```

## Testing

Unit tests are written with Vitest through Angular's unit test builder. End-to-end tests are written with Playwright and run in Chromium.

Current coverage includes:

- Rendering both calculator headings
- Premium calculator readiness state
- Premium increase percentage calculation
- Premium clear/reset behavior
- Original theme premium table: live results, fixed fees, keyboard navigation, copy, and clear

Spec files live beside the code they test. The main app spec is:

```text
src/app/app.spec.ts
```

End-to-end specs live in `e2e/`:

```text
e2e/ap-workup.spec.ts     calculator flows, theme toggle, original theme premium table
e2e/deep-verify.spec.ts   state-by-state audit of years licensed results
```

Playwright does not start the app itself. Run `pnpm start` in one terminal, then `pnpm test:e2e` in another.

## Continuous Integration

GitHub Actions runs on pushes and pull requests to `main`.

The CI workflow:

1. Installs dependencies with pnpm
2. Runs `pnpm test:ci`
3. Runs `pnpm build`
4. Installs Chromium for Playwright
5. Starts the app and runs the Playwright end-to-end tests

Workflow file:

```text
.github/workflows/ci.yml
```
