/**
 * Tests for State Constants
 * Validates comprehensive state data for all 51 jurisdictions
 */

import {
  STATE_METADATA,
  ADJACENT_STATES,
  getNonExpansionStates,
  getExpansionStates,
  getPublicOptionStates,
  getStatesWithStateSubsidies,
  isInCoverageGap,
  isMedicaidEligible,
  getAdjacentStates,
  compareStates,
} from '../state-constants';

describe('State Constants', () => {
  describe('STATE_METADATA completeness', () => {
    test('includes all 51 jurisdictions', () => {
      expect(Object.keys(STATE_METADATA)).toHaveLength(51);
    });

    test('all states have complete metadata', () => {
      Object.entries(STATE_METADATA).forEach(([code, meta]) => {
        expect(meta.code).toBe(code);
        expect(meta.name).toBeTruthy();
        expect(meta.exchangeType).toMatch(/^(FFM|SBM|SBM-FP)$/);
        expect(typeof meta.medicaidExpanded).toBe('boolean');
        expect(meta.medicaidThreshold).toBeGreaterThan(0);
        expect(meta.chipThreshold).toBeGreaterThan(0);
        expect(meta.tobaccoSurchargeLimit).toBeGreaterThanOrEqual(0);
        expect(meta.tobaccoSurchargeLimit).toBeLessThanOrEqual(0.50);
        expect(meta.geographicCostIndex).toBeGreaterThan(0);
        expect(meta.baseMonthlyPremium).toBeGreaterThan(0);
        expect(meta.carrierCount).toBeGreaterThanOrEqual(1);
        expect(meta.marketCompetitiveness).toMatch(/^(low|moderate|high)$/);
        expect(typeof meta.hasStateSubsidies).toBe('boolean');
        expect(typeof meta.hasPublicOption).toBe('boolean');
        expect(Array.isArray(meta.specialRegulations)).toBe(true);
      });
    });

    test('specific states are correctly categorized', () => {
      // Expansion states
      expect(STATE_METADATA.CA.medicaidExpanded).toBe(true);
      expect(STATE_METADATA.NY.medicaidExpanded).toBe(true);
      expect(STATE_METADATA.NC.medicaidExpanded).toBe(true);

      // Non-expansion states
      expect(STATE_METADATA.TX.medicaidExpanded).toBe(false);
      expect(STATE_METADATA.FL.medicaidExpanded).toBe(false);
      expect(STATE_METADATA.GA.medicaidExpanded).toBe(false);
    });

    test('exchange types are distributed correctly', () => {
      const ffmStates = Object.values(STATE_METADATA).filter(m => m.exchangeType === 'FFM');
      const sbmStates = Object.values(STATE_METADATA).filter(m => m.exchangeType === 'SBM');
      const sbmFpStates = Object.values(STATE_METADATA).filter(m => m.exchangeType === 'SBM-FP');

      // FFM (Federal) is most common
      expect(ffmStates.length).toBeGreaterThan(20);

      // State-based marketplaces exist
      expect(sbmStates.length).toBeGreaterThan(10);

      // At least one SBM-FP exists (PA)
      expect(sbmFpStates.length).toBeGreaterThanOrEqual(1);
      expect(STATE_METADATA.PA.exchangeType).toBe('SBM-FP');
    });

    test('tobacco prohibitions are correct', () => {
      // States that prohibit tobacco rating
      expect(STATE_METADATA.CA.tobaccoSurchargeLimit).toBe(0.00);
      expect(STATE_METADATA.MA.tobaccoSurchargeLimit).toBe(0.00);
      expect(STATE_METADATA.NY.tobaccoSurchargeLimit).toBe(0.00);

      // States with reduced limits
      expect(STATE_METADATA.AR.tobaccoSurchargeLimit).toBe(0.20);
      expect(STATE_METADATA.CO.tobaccoSurchargeLimit).toBe(0.15);
      expect(STATE_METADATA.KY.tobaccoSurchargeLimit).toBe(0.40);
      expect(STATE_METADATA.RI.tobaccoSurchargeLimit).toBe(0.25);

      // States with federal max (50%)
      expect(STATE_METADATA.TX.tobaccoSurchargeLimit).toBe(0.50);
      expect(STATE_METADATA.FL.tobaccoSurchargeLimit).toBe(0.50);
    });

    test('geographic cost indexes are reasonable', () => {
      // Alaska is most expensive
      expect(STATE_METADATA.AK.geographicCostIndex).toBeGreaterThan(1.40);

      // Texas is among cheapest
      expect(STATE_METADATA.TX.geographicCostIndex).toBeLessThan(0.85);

      // North Carolina is baseline (1.00)
      expect(STATE_METADATA.NC.geographicCostIndex).toBe(1.00);

      // High-cost states
      expect(STATE_METADATA.NY.geographicCostIndex).toBeGreaterThan(1.20);
      expect(STATE_METADATA.HI.geographicCostIndex).toBeGreaterThan(1.20);
    });

    test('public options are correctly identified', () => {
      expect(STATE_METADATA.CO.hasPublicOption).toBe(true);
      expect(STATE_METADATA.NV.hasPublicOption).toBe(true);
      expect(STATE_METADATA.WA.hasPublicOption).toBe(true);

      // Most states don't have public options
      expect(STATE_METADATA.TX.hasPublicOption).toBe(false);
      expect(STATE_METADATA.FL.hasPublicOption).toBe(false);
    });

    test('state subsidies are correctly identified', () => {
      expect(STATE_METADATA.CA.hasStateSubsidies).toBe(true);
      expect(STATE_METADATA.MA.hasStateSubsidies).toBe(true);
      expect(STATE_METADATA.MD.hasStateSubsidies).toBe(true);
      expect(STATE_METADATA.NJ.hasStateSubsidies).toBe(true);
      expect(STATE_METADATA.NY.hasStateSubsidies).toBe(true);
      expect(STATE_METADATA.WA.hasStateSubsidies).toBe(true);
    });

    test('market competitiveness matches carrier count', () => {
      Object.values(STATE_METADATA).forEach(meta => {
        if (meta.carrierCount >= 6) {
          expect(meta.marketCompetitiveness).toMatch(/moderate|high/);
        }
        if (meta.carrierCount <= 2) {
          expect(meta.marketCompetitiveness).toBe('low');
        }
      });
    });

    test('Wisconsin has highest carrier count', () => {
      const wiCarriers = STATE_METADATA.WI.carrierCount;

      Object.values(STATE_METADATA).forEach(meta => {
        expect(meta.carrierCount).toBeLessThanOrEqual(wiCarriers);
      });
    });

    test('Alaska has highest base premium', () => {
      const akPremium = STATE_METADATA.AK.baseMonthlyPremium;

      Object.values(STATE_METADATA).forEach(meta => {
        expect(meta.baseMonthlyPremium).toBeLessThanOrEqual(akPremium);
      });
    });

    test('recently expanded states are noted', () => {
      // States that expanded recently should have special regulations noting this
      const moRegulations = STATE_METADATA.MO.specialRegulations.join(' ');
      expect(moRegulations).toContain('2021');

      const ncRegulations = STATE_METADATA.NC.specialRegulations.join(' ');
      expect(ncRegulations).toContain('2024');

      const sdRegulations = STATE_METADATA.SD.specialRegulations.join(' ');
      expect(sdRegulations).toContain('2023');
    });
  });

  describe('ADJACENT_STATES', () => {
    test('includes all 51 jurisdictions', () => {
      expect(Object.keys(ADJACENT_STATES)).toHaveLength(51);
    });

    test('island states have no adjacent states', () => {
      expect(ADJACENT_STATES.AK).toHaveLength(0);
      expect(ADJACENT_STATES.HI).toHaveLength(0);
    });

    test('adjacency is bidirectional', () => {
      Object.entries(ADJACENT_STATES).forEach(([state, neighbors]) => {
        neighbors.forEach(neighbor => {
          expect(ADJACENT_STATES[neighbor]).toContain(state);
        });
      });
    });

    test('specific adjacencies are correct', () => {
      // Texas borders
      expect(ADJACENT_STATES.TX).toContain('LA');
      expect(ADJACENT_STATES.TX).toContain('AR');
      expect(ADJACENT_STATES.TX).toContain('OK');
      expect(ADJACENT_STATES.TX).toContain('NM');
      expect(ADJACENT_STATES.TX).not.toContain('CA');

      // California borders
      expect(ADJACENT_STATES.CA).toContain('OR');
      expect(ADJACENT_STATES.CA).toContain('NV');
      expect(ADJACENT_STATES.CA).toContain('AZ');
      expect(ADJACENT_STATES.CA).not.toContain('TX');

      // DC borders
      expect(ADJACENT_STATES.DC).toContain('MD');
      expect(ADJACENT_STATES.DC).toContain('VA');
      expect(ADJACENT_STATES.DC).toHaveLength(2);
    });

    test('Missouri has most borders (8)', () => {
      expect(ADJACENT_STATES.MO).toHaveLength(8);

      Object.values(ADJACENT_STATES).forEach(neighbors => {
        expect(neighbors.length).toBeLessThanOrEqual(8);
      });
    });
  });

  describe('getNonExpansionStates', () => {
    test('returns correct number of non-expansion states', () => {
      const nonExpansion = getNonExpansionStates();

      // As of 2025, 10 states haven't expanded
      expect(nonExpansion.length).toBe(10);
    });

    test('includes known non-expansion states', () => {
      const nonExpansion = getNonExpansionStates();

      expect(nonExpansion).toContain('TX');
      expect(nonExpansion).toContain('FL');
      expect(nonExpansion).toContain('GA');
      expect(nonExpansion).toContain('WY');
      expect(nonExpansion).toContain('MS');
      expect(nonExpansion).toContain('AL');
      expect(nonExpansion).toContain('TN');
      expect(nonExpansion).toContain('KS');
      expect(nonExpansion).toContain('SC');
      expect(nonExpansion).toContain('WI');
    });

    test('does not include expansion states', () => {
      const nonExpansion = getNonExpansionStates();

      expect(nonExpansion).not.toContain('CA');
      expect(nonExpansion).not.toContain('NY');
      expect(nonExpansion).not.toContain('NC');
    });
  });

  describe('getExpansionStates', () => {
    test('returns correct number of expansion states', () => {
      const expansion = getExpansionStates();

      // 41 states + DC = 41
      expect(expansion.length).toBe(41);
    });

    test('includes known expansion states', () => {
      const expansion = getExpansionStates();

      expect(expansion).toContain('CA');
      expect(expansion).toContain('NY');
      expect(expansion).toContain('NC');
      expect(expansion).toContain('DC');
    });

    test('expansion + non-expansion = 51', () => {
      const expansion = getExpansionStates();
      const nonExpansion = getNonExpansionStates();

      expect(expansion.length + nonExpansion.length).toBe(51);
    });
  });

  describe('getPublicOptionStates', () => {
    test('returns states with public options', () => {
      const publicOption = getPublicOptionStates();

      expect(publicOption).toContain('CO');
      expect(publicOption).toContain('NV');
      expect(publicOption).toContain('WA');
    });

    test('does not include states without public options', () => {
      const publicOption = getPublicOptionStates();

      expect(publicOption).not.toContain('TX');
      expect(publicOption).not.toContain('FL');
    });
  });

  describe('getStatesWithStateSubsidies', () => {
    test('returns states with additional subsidies', () => {
      const stateSubsidies = getStatesWithStateSubsidies();

      expect(stateSubsidies).toContain('CA');
      expect(stateSubsidies).toContain('MA');
      expect(stateSubsidies).toContain('MD');
      expect(stateSubsidies).toContain('NJ');
      expect(stateSubsidies).toContain('NY');
      expect(stateSubsidies).toContain('WA');
    });

    test('includes DC', () => {
      const stateSubsidies = getStatesWithStateSubsidies();
      expect(stateSubsidies).toContain('DC');
    });
  });

  describe('isInCoverageGap', () => {
    test('detects coverage gap in Texas', () => {
      expect(isInCoverageGap('TX', 105)).toBe(true);
      expect(isInCoverageGap('TX', 120)).toBe(true);
      expect(isInCoverageGap('TX', 137)).toBe(true);
    });

    test('no coverage gap below 100% FPL', () => {
      expect(isInCoverageGap('TX', 50)).toBe(false);
      expect(isInCoverageGap('TX', 99)).toBe(false);
    });

    test('no coverage gap at or above 138% FPL', () => {
      expect(isInCoverageGap('TX', 138)).toBe(false);
      expect(isInCoverageGap('TX', 200)).toBe(false);
    });

    test('no coverage gap in expansion states', () => {
      expect(isInCoverageGap('CA', 105)).toBe(false);
      expect(isInCoverageGap('CA', 120)).toBe(false);
      expect(isInCoverageGap('CA', 137)).toBe(false);
    });

    test('all non-expansion states have potential gap', () => {
      const nonExpansion = getNonExpansionStates();

      nonExpansion.forEach(state => {
        expect(isInCoverageGap(state, 120)).toBe(true);
      });
    });
  });

  describe('isMedicaidEligible', () => {
    test('eligibility in expansion state', () => {
      expect(isMedicaidEligible('CA', 100)).toBe(true);
      expect(isMedicaidEligible('CA', 137)).toBe(true);
      expect(isMedicaidEligible('CA', 138)).toBe(false);
      expect(isMedicaidEligible('CA', 200)).toBe(false);
    });

    test('eligibility in non-expansion state (Texas)', () => {
      // Texas has 18% threshold
      expect(isMedicaidEligible('TX', 10)).toBe(true);
      expect(isMedicaidEligible('TX', 17)).toBe(true);
      expect(isMedicaidEligible('TX', 18)).toBe(false);
      expect(isMedicaidEligible('TX', 50)).toBe(false);
    });

    test('DC has expanded threshold (215%)', () => {
      expect(isMedicaidEligible('DC', 138)).toBe(true);
      expect(isMedicaidEligible('DC', 200)).toBe(true);
      expect(isMedicaidEligible('DC', 214)).toBe(true);
      expect(isMedicaidEligible('DC', 215)).toBe(false);
    });

    test('handles edge cases', () => {
      expect(isMedicaidEligible('XX', 100)).toBe(false); // Invalid state
      expect(isMedicaidEligible('CA', 0)).toBe(true);    // 0% FPL
    });
  });

  describe('getAdjacentStates', () => {
    test('returns adjacent states for valid state', () => {
      const txAdjacent = getAdjacentStates('TX');
      expect(txAdjacent).toContain('LA');
      expect(txAdjacent).toHaveLength(4);
    });

    test('returns empty array for island states', () => {
      expect(getAdjacentStates('AK')).toHaveLength(0);
      expect(getAdjacentStates('HI')).toHaveLength(0);
    });

    test('returns empty array for invalid state', () => {
      expect(getAdjacentStates('XX')).toHaveLength(0);
    });
  });

  describe('compareStates', () => {
    test('compares premiums correctly', () => {
      const comparison = compareStates('TX', 'NY');

      expect(comparison.cheaper).toBe('TX');
      expect(comparison.premiumDifference).toBeGreaterThan(200);
    });

    test('identifies Medicaid expansion differences', () => {
      const comparison = compareStates('TX', 'CA');

      expect(comparison.medicaidDifference).toContain('CA');
      expect(comparison.medicaidDifference).toContain('expansion');
    });

    test('compares similar states', () => {
      const comparison = compareStates('NC', 'VA');

      // Both have Medicaid expansion now
      expect(comparison.medicaidDifference).toBe('Same');
    });

    test('throws error for invalid states', () => {
      expect(() => compareStates('XX', 'YY')).toThrow('Invalid state code');
      expect(() => compareStates('CA', 'XX')).toThrow('Invalid state code');
    });
  });

  describe('Real-World Scenarios', () => {
    test('California analysis', () => {
      const ca = STATE_METADATA.CA;

      expect(ca.exchangeType).toBe('SBM');
      expect(ca.medicaidExpanded).toBe(true);
      expect(ca.tobaccoSurchargeLimit).toBe(0.00);
      expect(ca.hasStateSubsidies).toBe(true);
      expect(ca.marketCompetitiveness).toBe('high');
      expect(ca.carrierCount).toBeGreaterThan(10);
    });

    test('Texas analysis (largest non-expansion state)', () => {
      const tx = STATE_METADATA.TX;

      expect(tx.medicaidExpanded).toBe(false);
      expect(tx.medicaidThreshold).toBe(18); // Very restrictive
      expect(tx.geographicCostIndex).toBeLessThan(0.85);
      expect(tx.specialRegulations.some(r => r.includes('coverage gap'))).toBe(true);
      expect(isInCoverageGap('TX', 120)).toBe(true);
    });

    test('New York special features', () => {
      const ny = STATE_METADATA.NY;

      expect(ny.tobaccoSurchargeLimit).toBe(0.00);
      expect(ny.hasStateSubsidies).toBe(true);
      expect(ny.specialRegulations.some(r => r.includes('Community rating'))).toBe(true);
      expect(ny.specialRegulations.some(r => r.includes('Essential Plan'))).toBe(true);
    });

    test('Wyoming challenges (least competitive)', () => {
      const wy = STATE_METADATA.WY;

      expect(wy.carrierCount).toBe(1);
      expect(wy.marketCompetitiveness).toBe('low');
      expect(wy.medicaidExpanded).toBe(false);
      expect(wy.specialRegulations.some(r => r.includes('1 carrier'))).toBe(true);
    });

    test('border state analysis: TX/LA', () => {
      // Louisiana expanded, Texas didn't
      expect(STATE_METADATA.TX.medicaidExpanded).toBe(false);
      expect(STATE_METADATA.LA.medicaidExpanded).toBe(true);

      // They're adjacent
      expect(ADJACENT_STATES.TX).toContain('LA');
      expect(ADJACENT_STATES.LA).toContain('TX');

      // Someone at 120% FPL has different options
      expect(isInCoverageGap('TX', 120)).toBe(true);
      expect(isMedicaidEligible('LA', 120)).toBe(true);
    });
  });
});
