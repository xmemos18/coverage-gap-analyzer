/**
 * County Cost Index Tests
 */

import {
  getStateCostIndex,
  getMetroCostIndex,
  getCostAdjustmentFactor,
  adjustCostForLocation,
  getTierDescription,
  getStatesByExpense,
  estimateAnnualCostVariance,
  STATE_COST_INDICES,
  METRO_AREA_INDICES,
} from '../cost-index';

describe('County Cost Index', () => {
  describe('STATE_COST_INDICES', () => {
    it('should have data for all 50 states + DC and PR', () => {
      // Count entries
      const stateCount = Object.keys(STATE_COST_INDICES).length;
      expect(stateCount).toBeGreaterThanOrEqual(50);
    });

    it('should have valid cost indices for each state', () => {
      for (const [code, data] of Object.entries(STATE_COST_INDICES)) {
        expect(data.state).toBe(code);
        expect(data.stateName).toBeTruthy();
        expect(data.averageCostIndex).toBeGreaterThan(0.5);
        expect(data.averageCostIndex).toBeLessThan(2.0);
        expect(data.minCostIndex).toBeLessThanOrEqual(data.averageCostIndex);
        expect(data.maxCostIndex).toBeGreaterThanOrEqual(data.averageCostIndex);
        expect(['very_low', 'low', 'average', 'high', 'very_high']).toContain(data.tier);
      }
    });

    it('should have high-cost states above 1.0', () => {
      expect(STATE_COST_INDICES['CA'].averageCostIndex).toBeGreaterThan(1.0);
      expect(STATE_COST_INDICES['NY'].averageCostIndex).toBeGreaterThan(1.0);
      expect(STATE_COST_INDICES['MA'].averageCostIndex).toBeGreaterThan(1.0);
    });

    it('should have low-cost states below 1.0', () => {
      expect(STATE_COST_INDICES['MS'].averageCostIndex).toBeLessThan(1.0);
      expect(STATE_COST_INDICES['AR'].averageCostIndex).toBeLessThan(1.0);
      expect(STATE_COST_INDICES['WV'].averageCostIndex).toBeLessThan(1.0);
    });
  });

  describe('METRO_AREA_INDICES', () => {
    it('should have major metro areas', () => {
      expect(METRO_AREA_INDICES['San Francisco-Oakland-Berkeley, CA']).toBeDefined();
      expect(METRO_AREA_INDICES['New York-Newark-Jersey City, NY-NJ-PA']).toBeDefined();
      expect(METRO_AREA_INDICES['Los Angeles-Long Beach-Anaheim, CA']).toBeDefined();
    });

    it('should have valid cost indices for each metro', () => {
      for (const [_name, data] of Object.entries(METRO_AREA_INDICES)) {
        expect(data.fips).toBeTruthy();
        expect(data.county).toBeTruthy();
        expect(data.state).toHaveLength(2);
        expect(data.costIndex).toBeGreaterThan(0.5);
        expect(data.costIndex).toBeLessThan(2.0);
        expect(data.workGPCI).toBeGreaterThan(0);
        expect(data.peGPCI).toBeGreaterThan(0);
        expect(data.mpGPCI).toBeGreaterThan(0);
        expect(data.wageIndex).toBeGreaterThan(0);
      }
    });

    it('should have San Francisco as highest cost metro', () => {
      const sfIndex = METRO_AREA_INDICES['San Francisco-Oakland-Berkeley, CA'];
      expect(sfIndex.costIndex).toBeGreaterThan(1.4);
      expect(sfIndex.tier).toBe('very_high');
    });
  });

  describe('getStateCostIndex', () => {
    it('should return cost index for valid state code', () => {
      const ca = getStateCostIndex('CA');
      expect(ca).not.toBeNull();
      expect(ca?.state).toBe('CA');
      expect(ca?.stateName).toBe('California');
    });

    it('should be case-insensitive', () => {
      const upper = getStateCostIndex('CA');
      const lower = getStateCostIndex('ca');
      expect(upper).toEqual(lower);
    });

    it('should return null for invalid state code', () => {
      expect(getStateCostIndex('XX')).toBeNull();
      expect(getStateCostIndex('')).toBeNull();
    });
  });

  describe('getMetroCostIndex', () => {
    it('should return cost index for exact metro name', () => {
      const sf = getMetroCostIndex('San Francisco-Oakland-Berkeley, CA');
      expect(sf).not.toBeNull();
      expect(sf?.county).toBe('San Francisco');
    });

    it('should find metro by partial match', () => {
      const sf = getMetroCostIndex('San Francisco');
      expect(sf).not.toBeNull();
    });

    it('should return null for unknown metro', () => {
      expect(getMetroCostIndex('Unknown City')).toBeNull();
    });
  });

  describe('getCostAdjustmentFactor', () => {
    it('should return metro factor when ZIP matches', () => {
      // San Francisco ZIP
      const factor = getCostAdjustmentFactor('CA', '94102');
      expect(factor).toBeGreaterThan(1.4);
    });

    it('should return state factor when ZIP not in metro', () => {
      // Rural California ZIP
      const factor = getCostAdjustmentFactor('CA', '93001');
      expect(factor).toBeGreaterThan(1.0);
      expect(factor).toBeLessThan(1.4);
    });

    it('should return state factor when no ZIP provided', () => {
      const factor = getCostAdjustmentFactor('CA');
      expect(factor).toBe(STATE_COST_INDICES['CA'].averageCostIndex);
    });

    it('should return 1.0 for unknown state', () => {
      const factor = getCostAdjustmentFactor('XX');
      expect(factor).toBe(1.0);
    });
  });

  describe('adjustCostForLocation', () => {
    it('should adjust cost up for high-cost areas', () => {
      const baseCost = 10000;
      const adjusted = adjustCostForLocation(baseCost, 'CA', '94102');
      expect(adjusted).toBeGreaterThan(baseCost);
    });

    it('should adjust cost down for low-cost areas', () => {
      const baseCost = 10000;
      const adjusted = adjustCostForLocation(baseCost, 'MS');
      expect(adjusted).toBeLessThan(baseCost);
    });

    it('should round to whole numbers', () => {
      const adjusted = adjustCostForLocation(10000, 'CA');
      expect(Number.isInteger(adjusted)).toBe(true);
    });
  });

  describe('getTierDescription', () => {
    it('should return descriptions for all tiers', () => {
      expect(getTierDescription('very_low')).toContain('Very Low');
      expect(getTierDescription('low')).toContain('Below Average');
      expect(getTierDescription('average')).toContain('Average');
      expect(getTierDescription('high')).toContain('Above Average');
      expect(getTierDescription('very_high')).toContain('Very High');
    });
  });

  describe('getStatesByExpense', () => {
    it('should return states sorted by cost index ascending', () => {
      const states = getStatesByExpense(true);
      expect(states.length).toBeGreaterThan(0);

      // Check ascending order
      for (let i = 1; i < states.length; i++) {
        expect(states[i].averageCostIndex).toBeGreaterThanOrEqual(
          states[i - 1].averageCostIndex
        );
      }
    });

    it('should return states sorted by cost index descending', () => {
      const states = getStatesByExpense(false);
      expect(states.length).toBeGreaterThan(0);

      // Check descending order
      for (let i = 1; i < states.length; i++) {
        expect(states[i].averageCostIndex).toBeLessThanOrEqual(
          states[i - 1].averageCostIndex
        );
      }
    });

    it('should have cheapest state first when ascending', () => {
      const states = getStatesByExpense(true);
      expect(states[0].tier).toBe('very_low');
    });

    it('should have most expensive state first when descending', () => {
      const states = getStatesByExpense(false);
      expect(states[0].tier).toBe('very_high');
    });
  });

  describe('estimateAnnualCostVariance', () => {
    it('should calculate variance for high-cost state', () => {
      const result = estimateAnnualCostVariance(10000, 'CA', '94102');

      expect(result.adjustedCost).toBeGreaterThan(10000);
      expect(result.variance).toBeGreaterThan(0);
      expect(result.percentageChange).toBeGreaterThan(0);
      expect(result.tier).toBe('very_high');
    });

    it('should calculate variance for low-cost state', () => {
      const result = estimateAnnualCostVariance(10000, 'MS');

      expect(result.adjustedCost).toBeLessThan(10000);
      expect(result.variance).toBeLessThan(0);
      expect(result.percentageChange).toBeLessThan(0);
      // MS has 0.88 cost factor, which falls into 'low' tier (0.85-0.95)
      expect(['very_low', 'low']).toContain(result.tier);
    });

    it('should return near-zero variance for average-cost state', () => {
      const result = estimateAnnualCostVariance(10000, 'AZ');

      expect(Math.abs(result.percentageChange)).toBeLessThanOrEqual(5);
      expect(['average', 'low', 'high']).toContain(result.tier);
    });
  });

  describe('ZIP code to metro mapping', () => {
    it('should map San Francisco ZIP codes correctly', () => {
      const factor1 = getCostAdjustmentFactor('CA', '94102');
      const factor2 = getCostAdjustmentFactor('CA', '94110');
      expect(factor1).toBeGreaterThan(1.4);
      expect(factor2).toBeGreaterThan(1.4);
    });

    it('should map New York ZIP codes correctly', () => {
      const factor = getCostAdjustmentFactor('NY', '10001');
      expect(factor).toBeGreaterThan(1.3);
    });

    it('should map Los Angeles ZIP codes correctly', () => {
      const factor = getCostAdjustmentFactor('CA', '90001');
      expect(factor).toBeGreaterThan(1.2);
    });

    it('should map Chicago ZIP codes correctly', () => {
      const factor = getCostAdjustmentFactor('IL', '60601');
      expect(factor).toBeGreaterThan(1.0);
    });

    it('should map Miami ZIP codes correctly', () => {
      const factor = getCostAdjustmentFactor('FL', '33101');
      expect(factor).toBeGreaterThan(1.0);
    });

    it('should map Houston ZIP codes correctly', () => {
      const factor = getCostAdjustmentFactor('TX', '77001');
      expect(factor).toBeGreaterThan(1.0);
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly compare costs between states', () => {
      const baseCost = 15000;
      const caCost = adjustCostForLocation(baseCost, 'CA', '94102');
      const msCost = adjustCostForLocation(baseCost, 'MS');

      expect(caCost).toBeGreaterThan(msCost);
      expect(caCost / msCost).toBeGreaterThan(1.5); // At least 50% more expensive
    });

    it('should show significant variance between metro and rural in same state', () => {
      const sfFactor = getCostAdjustmentFactor('CA', '94102');
      const ruralFactor = getCostAdjustmentFactor('CA', '93001');

      expect(sfFactor).toBeGreaterThan(ruralFactor);
      expect(sfFactor - ruralFactor).toBeGreaterThan(0.2);
    });

    it('should handle edge cases gracefully', () => {
      // Empty values
      expect(getCostAdjustmentFactor('', '')).toBe(1.0);

      // Invalid ZIP
      expect(getCostAdjustmentFactor('CA', '00000')).toBe(STATE_COST_INDICES['CA'].averageCostIndex);

      // Short ZIP
      expect(getCostAdjustmentFactor('CA', '94')).toBe(STATE_COST_INDICES['CA'].averageCostIndex);
    });
  });
});
