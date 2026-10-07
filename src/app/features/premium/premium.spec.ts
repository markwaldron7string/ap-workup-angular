import {
  blankSheetRow,
  buildPremiumResult,
  feeExceedsResult,
  feesExceedPremium,
  recalcSheetRow,
} from './premium';

describe('premium calculation', () => {
  it('calculates a premium increase percentage', () => {
    const result = buildPremiumResult(1000, 1125, 0);

    expect(result.title).toBe('Premium increase');
    expect(result.premiumPct).toBe('+12.5%');
    expect(result.premiumClass).toBe('increase');
    expect(result.meta).toBe('$1,000.00 → $1,125.00');
    expect(result.extraMeta).toBeUndefined();
  });

  it('prepares premium clipboard text as labeled rows', () => {
    expect(buildPremiumResult(100, 200, 0).copyText).toBe(
      'Old premium: $100\nNew premium: $200\n% Difference: 100.0%',
    );
  });

  it('omits copy text for premium decrease and no change', () => {
    const decrease = buildPremiumResult(100, 80, 0);
    expect(decrease.tone).toBe('danger');
    expect(decrease.premiumPct).toBe('-20.0%');
    expect(decrease.copyText).toBeUndefined();

    const flat = buildPremiumResult(100, 100, 0);
    expect(flat.tone).toBe('warn');
    expect(flat.premiumPct).toBe('0.0%');
    expect(flat.copyText).toBeUndefined();
  });

  it('notes the fixed fees that were excluded', () => {
    expect(buildPremiumResult(675, 775, 25).extraMeta).toBe('Fixed fees excluded: $25.00');
  });

  it('treats fees as too large when they use up the old premium or exceed the new one', () => {
    expect(feesExceedPremium(0, 100)).toBe(true);
    expect(feesExceedPremium(100, -1)).toBe(true);
    expect(feesExceedPremium(100, 0)).toBe(false);
    expect(feesExceedPremium(null, null)).toBe(false);
  });

  it('words the fee warning for a fee being added and for fees already in place', () => {
    const text = (fee: number | null) =>
      feeExceedsResult(fee, -50, 50)
        .body?.[0].map((part) => part.text)
        .join('');

    expect(text(150)).toBe(
      'Adding a fee of $150.00 would leave an adjusted old premium of -$50.00 and adjusted new premium of $50.00. Please verify the fee.',
    );
    expect(text(null)).toBe(
      'The fixed fees leave an adjusted old premium of -$50.00 and adjusted new premium of $50.00. Please verify the fee.',
    );
  });

  describe('table rows', () => {
    it('leaves a row empty until both premiums are entered', () => {
      const row = recalcSheetRow({ ...blankSheetRow(), oldInput: '700.00' });

      expect(row.change).toBe('');
      expect(row.result).toBeNull();
    });

    it('works out the change amount and percentage net of fees', () => {
      const row = recalcSheetRow({
        ...blankSheetRow(),
        oldInput: '700.00',
        newInput: '800.00',
        fees: [25],
      });

      expect(row.change).toBe('100.00');
      expect(row.result?.premiumPct).toBe('+14.8%');
      expect(row.result?.meta).toBe('$675.00 → $775.00');
    });

    it('warns instead of calculating when the fees exceed the premium', () => {
      const row = recalcSheetRow({
        ...blankSheetRow(),
        oldInput: '700.00',
        newInput: '800.00',
        fees: [700],
      });

      expect(row.change).toBe('');
      expect(row.result?.title).toBe('Fixed fee exceeds premium');
    });
  });
});
