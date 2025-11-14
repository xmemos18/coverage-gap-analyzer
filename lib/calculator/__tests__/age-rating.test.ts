/**
 * Tests for Age-Rating Cost Model
 * Validates ACA-compliant 3:1 age rating implementation
 */

import {
  getAgeRatingFactor,
  calculateAgeRatedPremium,
  calculateHouseholdPremium,
  getTobaccoSurchargeLimit,
  getStateBaseRate,
  calculatePremiumForState,
  getHouseholdPremiumRange,
  ACA_AGE_CURVE,
  GEOGRAPHIC_COST_INDEX,
} from '../age-rating';

describe('Age Rating Model', () => {
  describe('getAgeRatingFactor', () => {
    test('enforces 3:1 age rating ratio', () => {
      const age21Factor = getAgeRatingFactor(21);
      const age64Factor = getAgeRatingFactor(64);

      expect(age21Factor).toBe(1.000);
      expect(age64Factor).toBe(3.000);
      expect(age64Factor / age21Factor).toBe(3.0); // Exact 3:1 ratio
    });

    test('children under 21 have reduced rates', () => {
      const childFactor = getAgeRatingFactor(10);
      const teenFactor = getAgeRatingFactor(18);
      const adultFactor = getAgeRatingFactor(21);

      expect(childFactor).toBe(0.635); // Standard child rate
      expect(teenFactor).toBe(1.000); // Teens rated as 21
      expect(childFactor).toBeLessThan(adultFactor);
    });

    test('factors increase monotonically with age (21-64)', () => {
      for (let age = 21; age < 64; age++) {
        const currentFactor = getAgeRatingFactor(age);
        const nextFactor = getAgeRatingFactor(age + 1);
        expect(nextFactor).toBeGreaterThan(currentFactor);
      }
    });

    test('handles edge cases', () => {
      expect(getAgeRatingFactor(0)).toBe(0.635); // Infant
      expect(getAgeRatingFactor(65)).toBe(3.000); // Medicare age
      expect(getAgeRatingFactor(120)).toBe(3.000); // Maximum age
      expect(getAgeRatingFactor(-1)).toBe(0.635); // Negative clamped to 0
    });

    test('age 40 is approximately midpoint (1.452)', () => {
      const age40Factor = getAgeRatingFactor(40);
      expect(age40Factor).toBeCloseTo(1.452, 3);
    });
  });

  describe('calculateAgeRatedPremium', () => {
    const baseRate = 400; // $400 base for age 21

    test('calculates correct premium for age 21 baseline', () => {
      const premium = calculateAgeRatedPremium(baseRate, 21, 'NC', 'Silver');
      expect(premium).toBe(400.00); // NC is baseline state (1.0), Silver is baseline tier (1.0)
    });

    test('applies age rating correctly', () => {
      const premium64 = calculateAgeRatedPremium(baseRate, 64, 'NC', 'Silver');
      const premium21 = calculateAgeRatedPremium(baseRate, 21, 'NC', 'Silver');

      expect(premium64 / premium21).toBeCloseTo(3.0, 1); // 3:1 ratio
      expect(premium64).toBe(1200.00); // $400 * 3.0 * 1.0 (NC) * 1.0 (Silver)
    });

    test('applies geographic cost index', () => {
      const premiumNY = calculateAgeRatedPremium(baseRate, 21, 'NY', 'Silver');
      const premiumAL = calculateAgeRatedPremium(baseRate, 21, 'AL', 'Silver');

      expect(premiumNY).toBeGreaterThan(baseRate); // NY expensive (1.28)
      expect(premiumAL).toBeLessThan(baseRate); // AL cheap (0.85)

      // Verify exact calculations
      expect(premiumNY).toBe(512.00); // $400 * 1.0 (age 21) * 1.28 (NY)
      expect(premiumAL).toBe(340.00); // $400 * 1.0 (age 21) * 0.85 (AL)
    });

    test('applies metal tier multipliers', () => {
      const bronze = calculateAgeRatedPremium(baseRate, 30, 'NC', 'Bronze');
      const silver = calculateAgeRatedPremium(baseRate, 30, 'NC', 'Silver');
      const gold = calculateAgeRatedPremium(baseRate, 30, 'NC', 'Gold');
      const platinum = calculateAgeRatedPremium(baseRate, 30, 'NC', 'Platinum');

      expect(bronze).toBeLessThan(silver);
      expect(silver).toBeLessThan(gold);
      expect(gold).toBeLessThan(platinum);

      // Bronze is 75% of Silver, Gold is 130% of Silver
      expect(bronze / silver).toBeCloseTo(0.75, 2);
      expect(gold / silver).toBeCloseTo(1.30, 2);
    });

    test('applies tobacco surcharge in states that allow it', () => {
      const nonTobacco = calculateAgeRatedPremium(baseRate, 30, 'TX', 'Silver', false);
      const tobacco = calculateAgeRatedPremium(baseRate, 30, 'TX', 'Silver', true);

      expect(tobacco).toBeGreaterThan(nonTobacco);
      expect(tobacco / nonTobacco).toBeCloseTo(1.50, 2); // TX allows 50% surcharge
    });

    test('no tobacco surcharge in states that prohibit it', () => {
      const nonTobacco = calculateAgeRatedPremium(baseRate, 30, 'CA', 'Silver', false);
      const tobacco = calculateAgeRatedPremium(baseRate, 30, 'CA', 'Silver', true);

      expect(tobacco).toBe(nonTobacco); // CA prohibits tobacco surcharges
    });

    test('no tobacco surcharge for minors', () => {
      const childNonTobacco = calculateAgeRatedPremium(baseRate, 16, 'TX', 'Silver', false);
      const childTobacco = calculateAgeRatedPremium(baseRate, 16, 'TX', 'Silver', true);

      expect(childTobacco).toBe(childNonTobacco); // No surcharge for under 18
    });

    test('combined factors: realistic scenario', () => {
      // 50-year-old in Texas with Gold plan, tobacco user
      const premium = calculateAgeRatedPremium(baseRate, 50, 'TX', 'Gold', true);

      const expectedAgeFactor = getAgeRatingFactor(50); // 1.690
      const expectedGeoFactor = GEOGRAPHIC_COST_INDEX['TX']; // 0.810
      const expectedTierFactor = 1.30; // Gold
      const expectedTobaccoFactor = 1.50; // 50% surcharge in TX
      const expected = baseRate * expectedAgeFactor * expectedGeoFactor * expectedTierFactor * expectedTobaccoFactor;

      expect(premium).toBeCloseTo(expected, 2);
    });
  });

  describe('calculateHouseholdPremium', () => {
    const baseRate = 400;

    test('calculates single adult premium', () => {
      const premium = calculateHouseholdPremium(baseRate, [30], [], 'NC', 'Silver');
      const expectedSingle = calculateAgeRatedPremium(baseRate, 30, 'NC', 'Silver');

      expect(premium).toBe(expectedSingle);
    });

    test('calculates couple premium with age difference', () => {
      const premium = calculateHouseholdPremium(baseRate, [30, 55], [], 'NC', 'Silver');

      const person1 = calculateAgeRatedPremium(baseRate, 30, 'NC', 'Silver');
      const person2 = calculateAgeRatedPremium(baseRate, 55, 'NC', 'Silver');

      expect(premium).toBe(person1 + person2);
    });

    test('calculates family premium with children', () => {
      const adults = [35, 33];
      const children = [8, 5];

      const premium = calculateHouseholdPremium(baseRate, adults, children, 'NC', 'Silver');

      const adult1 = calculateAgeRatedPremium(baseRate, 35, 'NC', 'Silver');
      const adult2 = calculateAgeRatedPremium(baseRate, 33, 'NC', 'Silver');
      const child1 = calculateAgeRatedPremium(baseRate, 8, 'NC', 'Silver');
      const child2 = calculateAgeRatedPremium(baseRate, 5, 'NC', 'Silver');

      expect(premium).toBe(adult1 + adult2 + child1 + child2);
    });

    test('caps child premium at 3 children maximum', () => {
      const adults = [40];
      const twoKids = [10, 8];
      const fourKids = [10, 8, 6, 4];

      const premiumTwo = calculateHouseholdPremium(baseRate, adults, twoKids, 'NC', 'Silver');
      const premiumFour = calculateHouseholdPremium(baseRate, adults, fourKids, 'NC', 'Silver');

      // 4th child should not add to premium
      const childRate = calculateAgeRatedPremium(baseRate, 10, 'NC', 'Silver');
      expect(premiumFour - premiumTwo).toBeLessThan(2 * childRate);
      expect(premiumFour - premiumTwo).toBeCloseTo(childRate, 0); // Only 1 additional child counted
    });

    test('applies tobacco surcharge to correct household members', () => {
      const adults = [45, 42];
      const tobaccoUsers = [true, false]; // Only first adult uses tobacco

      const withTobacco = calculateHouseholdPremium(baseRate, adults, [], 'TX', 'Silver', tobaccoUsers);
      const withoutTobacco = calculateHouseholdPremium(baseRate, adults, [], 'TX', 'Silver', [false, false]);

      expect(withTobacco).toBeGreaterThan(withoutTobacco);

      // Difference should be 50% of first adult's premium
      const firstAdultBase = calculateAgeRatedPremium(baseRate, 45, 'TX', 'Silver', false);
      const expectedDifference = firstAdultBase * 0.50;

      expect(withTobacco - withoutTobacco).toBeCloseTo(expectedDifference, 0);
    });

    test('realistic family scenario', () => {
      // Family of 4 in California: adults 38 & 36, children 12 & 9
      const adults = [38, 36];
      const children = [12, 9];

      const premium = calculateHouseholdPremium(baseRate, adults, children, 'CA', 'Silver');

      // Verify it's reasonable (should be ~$1500-2000 for family in CA)
      expect(premium).toBeGreaterThan(1000);
      expect(premium).toBeLessThan(3000);
    });
  });

  describe('getTobaccoSurchargeLimit', () => {
    test('returns 0 for states that prohibit tobacco surcharges', () => {
      expect(getTobaccoSurchargeLimit('CA')).toBe(0.00);
      expect(getTobaccoSurchargeLimit('NY')).toBe(0.00);
      expect(getTobaccoSurchargeLimit('MA')).toBe(0.00);
    });

    test('returns reduced limits for specific states', () => {
      expect(getTobaccoSurchargeLimit('AR')).toBe(0.20);
      expect(getTobaccoSurchargeLimit('CO')).toBe(0.15);
      expect(getTobaccoSurchargeLimit('KY')).toBe(0.40);
    });

    test('returns federal max (50%) for most states', () => {
      expect(getTobaccoSurchargeLimit('TX')).toBe(0.50);
      expect(getTobaccoSurchargeLimit('FL')).toBe(0.50);
      expect(getTobaccoSurchargeLimit('OH')).toBe(0.50);
    });
  });

  describe('getStateBaseRate', () => {
    test('returns estimated rates for all states', () => {
      expect(getStateBaseRate('AK')).toBe(650); // Highest
      expect(getStateBaseRate('TX')).toBe(315); // Low cost
      expect(getStateBaseRate('NC')).toBe(410); // Baseline
    });

    test('returns national average for unknown states', () => {
      expect(getStateBaseRate('XX')).toBe(410);
    });

    test('high-cost states have higher base rates', () => {
      expect(getStateBaseRate('AK')).toBeGreaterThan(getStateBaseRate('NC'));
      expect(getStateBaseRate('NY')).toBeGreaterThan(getStateBaseRate('TX'));
    });
  });

  describe('calculatePremiumForState', () => {
    test('uses state-specific base rate', () => {
      const premiumNY = calculatePremiumForState(30, 'NY', 'Silver');
      const premiumTX = calculatePremiumForState(30, 'TX', 'Silver');

      expect(premiumNY).toBeGreaterThan(premiumTX);
    });

    test('combines state base rate with geographic index', () => {
      const premium = calculatePremiumForState(21, 'NY', 'Silver');
      const baseRate = getStateBaseRate('NY'); // 580
      const geoIndex = GEOGRAPHIC_COST_INDEX['NY']; // 1.28

      expect(premium).toBe(baseRate * 1.0 * geoIndex * 1.0); // age 21, Silver tier
    });
  });

  describe('getHouseholdPremiumRange', () => {
    test('returns premiums for all metal tiers', () => {
      const range = getHouseholdPremiumRange([30], [], 'NC');

      expect(range).toHaveProperty('bronze');
      expect(range).toHaveProperty('silver');
      expect(range).toHaveProperty('gold');
      expect(range).toHaveProperty('platinum');
    });

    test('bronze < silver < gold < platinum', () => {
      const range = getHouseholdPremiumRange([40], [], 'NC');

      expect(range.bronze).toBeLessThan(range.silver);
      expect(range.silver).toBeLessThan(range.gold);
      expect(range.gold).toBeLessThan(range.platinum);
    });

    test('family premium range is reasonable', () => {
      const range = getHouseholdPremiumRange([38, 36], [10, 7], 'CA');

      // Family in CA should be ~$1000-3000/month depending on tier
      expect(range.bronze).toBeGreaterThan(1000);
      expect(range.platinum).toBeLessThan(4000);
    });

    test('tobacco affects premium range', () => {
      const noTobacco = getHouseholdPremiumRange([45], [], 'TX', [false]);
      const withTobacco = getHouseholdPremiumRange([45], [], 'TX', [true]);

      expect(withTobacco.silver).toBeGreaterThan(noTobacco.silver);
      expect(withTobacco.silver / noTobacco.silver).toBeCloseTo(1.50, 1);
    });
  });

  describe('Real-World Scenarios', () => {
    test('young healthy individual in low-cost state', () => {
      // 25-year-old in Texas, Bronze plan
      const premium = calculatePremiumForState(25, 'TX', 'Bronze', false);

      // Should be quite affordable (~$250-350/month)
      expect(premium).toBeGreaterThan(200);
      expect(premium).toBeLessThan(400);
    });

    test('older adult in high-cost state', () => {
      // 60-year-old in New York, Gold plan
      const premium = calculatePremiumForState(60, 'NY', 'Gold', false);

      // Should be expensive (~$1400-1800/month)
      expect(premium).toBeGreaterThan(1200);
      expect(premium).toBeLessThan(2000);
    });

    test('family of 4 middle income scenario', () => {
      // Parents 42 & 40, children 8 & 6 in North Carolina, Silver plan
      const adults = [42, 40];
      const children = [8, 6];

      const premium = calculateHouseholdPremium(410, adults, children, 'NC', 'Silver');

      // Should be reasonable family premium (~$1500-2200/month)
      expect(premium).toBeGreaterThan(1400);
      expect(premium).toBeLessThan(2500);
    });

    test('near-Medicare couple comparison', () => {
      // 64-year-old pays max rate, 62-year-old pays less
      const premium64 = calculatePremiumForState(64, 'FL', 'Silver');
      const premium62 = calculatePremiumForState(62, 'FL', 'Silver');

      expect(premium64).toBeGreaterThan(premium62);

      // Age 64 should be notably more expensive
      const difference = premium64 - premium62;
      expect(difference).toBeGreaterThan(200); // Significant jump
    });
  });
});
