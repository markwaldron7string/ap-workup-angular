import { TestBed } from '@angular/core/testing';
import { PremiumFormStore } from './premium-form.store';

describe('PremiumFormStore', () => {
  let store: PremiumFormStore;

  /** Types a premium and leaves the field, as a user would. */
  function enter(kind: 'old' | 'new', text: string): void {
    store.typePremium(kind, text);
    store.commitPremium(kind);
  }

  beforeEach(() => {
    store = TestBed.inject(PremiumFormStore);
  });

  it('enables premium calculation only when both premium values are parsed', () => {
    expect(store.ready()).toBe(false);

    store.typePremium('old', '1000');
    expect(store.ready()).toBe(false);

    store.typePremium('new', '1200');
    expect(store.ready()).toBe(true);
  });

  it('calculates a premium increase percentage', () => {
    store.typePremium('old', '1000');
    store.typePremium('new', '1125');

    store.calculate();

    expect(store.result()?.title).toBe('Premium increase');
    expect(store.result()?.premiumPct).toBe('+12.5%');
  });

  it('tidies the text of a premium when its field is left', () => {
    enter('old', '1000');

    expect(store.fields.old.text()).toBe('1,000.00');
  });

  it('shows premiums net of fees, and reads an edited net premium back as net', () => {
    enter('old', '1000');
    enter('new', '1200');
    store.feeText.set('25');
    store.addFee();

    expect(store.fields.old.text()).toBe('975.00');
    expect(store.fields.new.text()).toBe('1,175.00');
    expect(store.fields.old.gross()).toBe(1000);

    // Leaving the field untouched must not subtract the fee a second time.
    store.commitPremium('old');
    expect(store.fields.old.gross()).toBe(1000);
    expect(store.fields.old.text()).toBe('975.00');
  });

  it('includes a fee left in the input field even if "Add fee" was never clicked', () => {
    enter('old', '100');
    enter('new', '200');
    store.feeText.set('5');

    store.calculate();

    expect(store.fees()).toEqual([5]);
    expect(store.result()?.premiumPct).toBe('+105.3%');
  });

  it('includes both an already-added fee and a still-pending typed fee on calculate', () => {
    enter('old', '100');
    enter('new', '200');
    store.feeText.set('5');
    store.addFee();
    store.feeText.set('1');

    store.calculate();

    expect(store.fees()).toEqual([5, 1]);
    expect(store.netOld()).toBe(94);
    expect(store.netNew()).toBe(194);
    expect(store.result()?.premiumPct).toBe('+106.4%');
  });

  it('refuses a fee that exceeds the premium and explains why', () => {
    enter('old', '100');
    enter('new', '200');
    store.feeText.set('150');

    expect(store.addFee()).toBe(false);

    expect(store.fees()).toEqual([]);
    expect(store.result()?.title).toBe('Fixed fee exceeds premium');
  });

  it('clears the result when a premium or fee changes', () => {
    enter('old', '100');
    enter('new', '200');
    store.calculate();
    expect(store.result()).not.toBeNull();

    store.typePremium('new', '300');
    expect(store.result()).toBeNull();
  });

  it('clears premium values and result state', () => {
    enter('old', '1000');
    enter('new', '1125');
    store.feeText.set('25');
    store.calculate();
    expect(store.fees()).toEqual([25]);

    store.clear();

    expect(store.fields.old.text()).toBe('');
    expect(store.fields.new.text()).toBe('');
    expect(store.feeText()).toBe('');
    expect(store.netOld()).toBeNull();
    expect(store.netNew()).toBeNull();
    expect(store.fees()).toEqual([]);
    expect(store.result()).toBeNull();
  });
});
