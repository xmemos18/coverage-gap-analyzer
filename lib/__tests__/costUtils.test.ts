/**
 * Tests for cost calculation utilities
 */

import {
  monthlyToAnnual,
  monthlyCostRangeToAnnual,
  calculateAverageCost,
  calculateTotalCostOverYears,
  calculateCostRangeOverYears,
  calculateMemberCostRange,
  combineCostRanges,
  calculateMonthlySavings,
  calculateAnnualSavings,
  calculateSavingsOverYears,
  formatCostWithPeriod,
  formatCostRangeWithPeriod,
  isSavingMoney,
  isCostingMore,
  calculatePercentageSavings,
} from '../costUtils';
import { CostRange } from '@/types';

describe('Cost Utilities', () => {
  describe('monthlyToAnnual', () => {
    it('should convert monthly cost to annual cost', () => {
      expect(monthlyToAnnual(100)).toBe(1200);
      expect(monthlyToAnnual(500)).toBe(6000);
      expect(monthlyToAnnual(0)).toBe(0);
    });
  });

  describe('monthlyCostRangeToAnnual', () => {
    it('should convert monthly cost range to annual cost range', () => {
      const costRange: CostRange = { low: 100, high: 200 };
      const result = monthlyCostRangeToAnnual(costRange);
      expect(result).toEqual({ low: 1200, high: 2400 });
    });
  });

  describe('calculateAverageCost', () => {
    it('should calculate the average of a cost range', () => {
      expect(calculateAverageCost({ low: 100, high: 200 })).toBe(150);
      expect(calculateAverageCost({ low: 300, high: 500 })).toBe(400);
      expect(calculateAverageCost({ low: 0, high: 0 })).toBe(0);
    });
  });

  describe('calculateTotalCostOverYears', () => {
    it('should calculate total cost over multiple years', () => {
      expect(calculateTotalCostOverYears(100, 1)).toBe(1200);
      expect(calculateTotalCostOverYears(100, 5)).toBe(6000);
      expect(calculateTotalCostOverYears(500, 3)).toBe(18000);
    });
  });

  describe('calculateCostRangeOverYears', () => {
    it('should calculate cost range over multiple years', () => {
      const costRange: CostRange = { low: 100, high: 200 };
      const result = calculateCostRangeOverYears(costRange, 5);
      expect(result).toEqual({ low: 6000, high: 12000 });
    });
  });

  describe('calculateMemberCostRange', () => {
    it('should calculate cost range for multiple members', () => {
      const baseCost: CostRange = { low: 100, high: 200 };
      const result = calculateMemberCostRange(baseCost, 3);
      expect(result).toEqual({ low: 300, high: 600 });
    });

    it('should handle single member', () => {
      const baseCost: CostRange = { low: 100, high: 200 };
      const result = calculateMemberCostRange(baseCost, 1);
      expect(result).toEqual({ low: 100, high: 200 });
    });
  });

  describe('combineCostRanges', () => {
    it('should combine multiple cost ranges', () => {
      const range1: CostRange = { low: 100, high: 200 };
      const range2: CostRange = { low: 50, high: 100 };
      const range3: CostRange = { low: 25, high: 50 };
      const result = combineCostRanges(range1, range2, range3);
      expect(result).toEqual({ low: 175, high: 350 });
    });

    it('should handle empty input', () => {
      const result = combineCostRanges();
      expect(result).toEqual({ low: 0, high: 0 });
    });

    it('should handle single cost range', () => {
      const range: CostRange = { low: 100, high: 200 };
      const result = combineCostRanges(range);
      expect(result).toEqual({ low: 100, high: 200 });
    });
  });

  describe('calculateMonthlySavings', () => {
    it('should calculate monthly savings', () => {
      expect(calculateMonthlySavings(500, 300)).toBe(200);
      expect(calculateMonthlySavings(1000, 800)).toBe(200);
    });

    it('should return negative for cost increase', () => {
      expect(calculateMonthlySavings(300, 500)).toBe(-200);
    });

    it('should return zero for same cost', () => {
      expect(calculateMonthlySavings(500, 500)).toBe(0);
    });
  });

  describe('calculateAnnualSavings', () => {
    it('should calculate annual savings', () => {
      expect(calculateAnnualSavings(500, 300)).toBe(2400);
      expect(calculateAnnualSavings(1000, 800)).toBe(2400);
    });

    it('should return negative for annual cost increase', () => {
      expect(calculateAnnualSavings(300, 500)).toBe(-2400);
    });
  });

  describe('calculateSavingsOverYears', () => {
    it('should calculate savings over multiple years', () => {
      expect(calculateSavingsOverYears(500, 300, 1)).toBe(2400);
      expect(calculateSavingsOverYears(500, 300, 5)).toBe(12000);
    });

    it('should handle cost increases over years', () => {
      expect(calculateSavingsOverYears(300, 500, 3)).toBe(-7200);
    });
  });

  describe('formatCostWithPeriod', () => {
    it('should format cost with monthly period', () => {
      expect(formatCostWithPeriod(500, 'monthly')).toBe('$500/month');
      expect(formatCostWithPeriod(1234.56, 'monthly')).toBe('$1,235/month');
    });

    it('should format cost with annual period', () => {
      expect(formatCostWithPeriod(6000, 'annual')).toBe('$6,000/year');
      expect(formatCostWithPeriod(12345.67, 'annual')).toBe('$12,346/year');
    });

    it('should format cost with total period', () => {
      expect(formatCostWithPeriod(25000, 'total')).toBe('$25,000');
    });

    it('should round costs to nearest dollar', () => {
      expect(formatCostWithPeriod(123.45, 'monthly')).toBe('$123/month');
      expect(formatCostWithPeriod(123.56, 'monthly')).toBe('$124/month');
    });
  });

  describe('formatCostRangeWithPeriod', () => {
    it('should format cost range with monthly period', () => {
      const range: CostRange = { low: 300, high: 500 };
      expect(formatCostRangeWithPeriod(range, 'monthly')).toBe('$300-$500/month');
    });

    it('should format cost range with annual period', () => {
      const range: CostRange = { low: 3600, high: 6000 };
      expect(formatCostRangeWithPeriod(range, 'annual')).toBe('$3,600-$6,000/year');
    });

    it('should format single value when low equals high', () => {
      const range: CostRange = { low: 500, high: 500 };
      expect(formatCostRangeWithPeriod(range, 'monthly')).toBe('$500/month');
    });

    it('should round range values', () => {
      const range: CostRange = { low: 123.45, high: 567.89 };
      expect(formatCostRangeWithPeriod(range, 'monthly')).toBe('$123-$568/month');
    });
  });

  describe('isSavingMoney', () => {
    it('should return true when saving money', () => {
      expect(isSavingMoney(500, 300)).toBe(true);
      expect(isSavingMoney(1000, 999)).toBe(true);
    });

    it('should return false when costing more', () => {
      expect(isSavingMoney(300, 500)).toBe(false);
    });

    it('should return false when costs are equal', () => {
      expect(isSavingMoney(500, 500)).toBe(false);
    });
  });

  describe('isCostingMore', () => {
    it('should return true when costing more', () => {
      expect(isCostingMore(300, 500)).toBe(true);
      expect(isCostingMore(999, 1000)).toBe(true);
    });

    it('should return false when saving money', () => {
      expect(isCostingMore(500, 300)).toBe(false);
    });

    it('should return false when costs are equal', () => {
      expect(isCostingMore(500, 500)).toBe(false);
    });
  });

  describe('calculatePercentageSavings', () => {
    it('should calculate percentage savings', () => {
      expect(calculatePercentageSavings(500, 300)).toBe(40);
      expect(calculatePercentageSavings(1000, 750)).toBe(25);
    });

    it('should calculate negative percentage for cost increase', () => {
      expect(calculatePercentageSavings(300, 500)).toBeCloseTo(-66.67, 1);
    });

    it('should return zero for equal costs', () => {
      expect(calculatePercentageSavings(500, 500)).toBe(0);
    });

    it('should return zero when current cost is zero', () => {
      expect(calculatePercentageSavings(0, 100)).toBe(0);
    });
  });
});
