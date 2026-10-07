import {
  EXACT_STATES,
  MONTHS_STATES,
  RANGE_STATES,
  STATE_RULES,
  findStateRule,
  formatAge,
} from './state-rules';

describe('state rules', () => {
  it('covers all 50 states and D.C. exactly once', () => {
    const codes = STATE_RULES.map((state) => state.code);

    expect(codes.length).toBe(51);
    expect(new Set(codes).size).toBe(51);
  });

  it('aligns previously divergent state ages with the AP guideline table', () => {
    const guidelineRules = [
      ['CT', { pM: 192, lM: 192, pL: '16', lL: '16' }],
      ['DE', { pM: 190, lM: 192, pL: '15y10m', lL: '16' }],
      ['DC', { pM: 192, lM: 204, pL: '16', lL: '17' }],
      ['HI', { pM: 186, lM: 192, pL: '15½', lL: '16' }],
      ['ID', { pM: 180, lM: 180, pL: '15', lL: '15' }],
      ['KY', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['LA', { pM: 180, lM: 204, pL: '15', lL: '17' }],
      ['MD', { pM: 189, lM: 198, pL: '15y9m', lL: '16½' }],
      ['MS', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['MT', { pM: 174, lM: 180, pL: '14½', lL: '15' }],
      ['NE', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['NM', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['NY', { pM: 192, lM: 204, pL: '16', lL: '17' }],
      ['RI', { pM: 192, lM: 198, pL: '16', lL: '16½' }],
      ['SC', { pM: 180, lM: 186, pL: '15', lL: '15½' }],
      ['SD', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['WA', { pM: 180, lM: 192, pL: '15', lL: '16' }],
      ['WI', { pM: 180, lM: 192, pL: '15', lL: '16' }],
    ] as const;

    for (const [code, expected] of guidelineRules) {
      const rule = findStateRule(code);

      expect(rule?.permitMonths, code).toBe(expected.pM);
      expect(rule?.licenseMonths, code).toBe(expected.lM);
      expect(formatAge(rule!.permitMonths), code).toBe(expected.pL);
      expect(formatAge(rule!.licenseMonths), code).toBe(expected.lL);
    }
  });

  it('groups the states the way the state menu lists them', () => {
    expect(EXACT_STATES.map((state) => state.code)).toEqual(['MA', 'NC', 'CA']);
    expect(MONTHS_STATES.map((state) => state.code)).toEqual(['NJ']);
    expect(RANGE_STATES.length).toBe(47);
    expect(RANGE_STATES.slice(0, 4).map((state) => state.code)).toEqual(['AK', 'AL', 'AR', 'AZ']);
    expect(RANGE_STATES.at(-1)?.code).toBe('WY');
  });

  it('finds a rule by code', () => {
    expect(findStateRule('TX')?.name).toBe('Texas');
    expect(findStateRule('')).toBeNull();
    expect(findStateRule('ZZ')).toBeNull();
  });
});
