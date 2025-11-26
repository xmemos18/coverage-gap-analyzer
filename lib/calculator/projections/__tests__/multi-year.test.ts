/**
 * Tests for Multi-Year Cost Projections
 */

import {
  generateMultiYearProjection,
  quickFiveYearProjection,
  projectToMedicare,
  DEFAULT_INFLATION_FACTORS,
} from '../multi-year';

describe('Multi-Year Cost Projections', () => {
  describe('generateMultiYearProjection', () => {
    it('generates correct number of projections for 5-year period', () => {
      const projection = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 5,
        state: 'NC',
      });

      // 5 years = 6 data points (year 0 through year 5)
      expect(projection.projections).toHaveLength(6);
      expect(projection.startAge).toBe(40);
      expect(projection.endAge).toBe(45);
    });

    it('generates projections with increasing costs over time', () => {
      const projection = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 5,
        state: 'NC',
      });

      // First year should have lowest cost
      const firstYear = projection.projections[0];
      const lastYear = projection.projections[projection.projections.length - 1];

      expect(firstYear).toBeDefined();
      expect(lastYear).toBeDefined();
      expect(lastYear!.totalAnnualCost).toBeGreaterThan(firstYear!.totalAnnualCost);
    });

    it('calculates cumulative costs correctly', () => {
      const projection = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 3,
        state: 'NC',
      });

      // Cumulative should be sum of all previous years
      let runningTotal = 0;
      for (const yearProjection of projection.projections) {
        runningTotal += yearProjection.totalAnnualCost;
        expect(yearProjection.cumulativeCost).toBe(runningTotal);
      }
    });

    it('applies age rating factors correctly', () => {
      const projection = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 10,
        state: 'NC',
      });

      // Age rating should increase with age
      const age40 = projection.projections.find(p => p.age === 40);
      const age50 = projection.projections.find(p => p.age === 50);

      expect(age40).toBeDefined();
      expect(age50).toBeDefined();
      expect(age50!.ageRatingFactor).toBeGreaterThan(age40!.ageRatingFactor);
    });

    it('detects Medicare transition at age 65', () => {
      const projection = generateMultiYearProjection({
        currentAge: 62,
        yearsToProject: 5,
        state: 'NC',
      });

      // Should have Medicare transition
      expect(projection.majorTransitions).toHaveLength(1);
      expect(projection.majorTransitions[0]?.type).toBe('medicare-eligible');

      // The year turning 65 should have the transition
      const transition65 = projection.projections.find(p => p.age === 65);
      expect(transition65?.transition).toBeDefined();
      expect(transition65?.transition?.type).toBe('medicare-eligible');
    });

    it('detects age 26 transition (off parents insurance)', () => {
      const projection = generateMultiYearProjection({
        currentAge: 24,
        yearsToProject: 4,
        state: 'NC',
      });

      // Should have age 26 transition
      expect(projection.majorTransitions).toHaveLength(1);
      expect(projection.majorTransitions[0]?.type).toBe('age-26-off-parents');
    });

    it('applies health status multipliers', () => {
      const goodHealth = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 1,
        state: 'NC',
        healthStatus: 'good',
      });

      const poorHealth = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 1,
        state: 'NC',
        healthStatus: 'poor',
      });

      // Poor health should have higher costs
      expect(poorHealth.projections[0]!.projectedMedicalCosts).toBeGreaterThan(
        goodHealth.projections[0]!.projectedMedicalCosts
      );
    });

    it('applies chronic condition costs', () => {
      const noConditions = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 1,
        state: 'NC',
        chronicConditions: [],
      });

      const withDiabetes = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 1,
        state: 'NC',
        chronicConditions: ['diabetes'],
      });

      // Diabetes should add significant cost
      expect(withDiabetes.projections[0]!.projectedMedicalCosts).toBeGreaterThan(
        noConditions.projections[0]!.projectedMedicalCosts + 5000
      );
    });

    it('calculates confidence intervals', () => {
      const projection = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 5,
        state: 'NC',
      });

      for (const yearProjection of projection.projections) {
        // P10 should be less than P50, which should be less than P90
        expect(yearProjection.confidenceInterval.p10).toBeLessThan(
          yearProjection.confidenceInterval.p50
        );
        expect(yearProjection.confidenceInterval.p50).toBeLessThan(
          yearProjection.confidenceInterval.p90
        );

        // P50 should equal the expected total
        expect(yearProjection.confidenceInterval.p50).toBe(yearProjection.totalAnnualCost);
      }
    });

    it('generates insights', () => {
      const projection = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 5,
        state: 'NC',
      });

      expect(projection.insights).toBeDefined();
      expect(projection.insights.length).toBeGreaterThan(0);

      // Should include cost increase insight
      const hasCostInsight = projection.insights.some(i => i.includes('increase') || i.includes('projected'));
      expect(hasCostInsight).toBe(true);
    });

    it('handles custom inflation factors', () => {
      const defaultInflation = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 5,
        state: 'NC',
      });

      const highInflation = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 5,
        state: 'NC',
        inflationFactors: {
          medicalInflation: 0.10, // 10% inflation
          premiumInflation: 0.08,
        },
      });

      // Higher inflation should result in higher costs
      const lastDefault = defaultInflation.projections[defaultInflation.projections.length - 1];
      const lastHigh = highInflation.projections[highInflation.projections.length - 1];

      expect(lastHigh!.totalAnnualCost).toBeGreaterThan(lastDefault!.totalAnnualCost);
    });

    it('adjusts for state cost differences', () => {
      const lowCostState = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 1,
        state: 'TX', // Low cost state
      });

      const highCostState = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 1,
        state: 'NY', // High cost state
      });

      // NY should be more expensive than TX
      expect(highCostState.projections[0]!.projectedMonthlyPremium).toBeGreaterThan(
        lowCostState.projections[0]!.projectedMonthlyPremium
      );
    });

    it('applies tobacco surcharge', () => {
      const nonSmoker = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 1,
        state: 'NC',
        usesTobacco: false,
      });

      const smoker = generateMultiYearProjection({
        currentAge: 40,
        yearsToProject: 1,
        state: 'NC',
        usesTobacco: true,
      });

      // Smoker should pay more
      expect(smoker.projections[0]!.projectedMonthlyPremium).toBeGreaterThan(
        nonSmoker.projections[0]!.projectedMonthlyPremium
      );
    });
  });

  describe('quickFiveYearProjection', () => {
    it('generates 5-year projection with defaults', () => {
      const projection = quickFiveYearProjection(40, 'NC');

      expect(projection.projections).toHaveLength(6);
      expect(projection.startAge).toBe(40);
      expect(projection.endAge).toBe(45);
      expect(projection.metalTier).toBe('Silver');
    });

    it('accepts custom metal tier', () => {
      const bronzeProjection = quickFiveYearProjection(40, 'NC', 'Bronze');
      const goldProjection = quickFiveYearProjection(40, 'NC', 'Gold');

      // Gold should be more expensive than Bronze
      expect(goldProjection.projections[0]!.projectedMonthlyPremium).toBeGreaterThan(
        bronzeProjection.projections[0]!.projectedMonthlyPremium
      );
    });
  });

  describe('projectToMedicare', () => {
    it('projects from current age to 65', () => {
      const projection = projectToMedicare(55, 'NC');

      expect(projection.startAge).toBe(55);
      expect(projection.endAge).toBe(65);
      expect(projection.projections).toHaveLength(11); // 55 to 65 inclusive
    });

    it('handles users already Medicare eligible', () => {
      const projection = projectToMedicare(70, 'NC');

      // Should project 10 years forward for Medicare users
      expect(projection.startAge).toBe(70);
      expect(projection.projections.length).toBeGreaterThan(1);
    });

    it('includes Medicare transition insight', () => {
      const projection = projectToMedicare(60, 'NC');

      // Should have Medicare transition
      expect(projection.majorTransitions.some(t => t.type === 'medicare-eligible')).toBe(true);
    });
  });

  describe('DEFAULT_INFLATION_FACTORS', () => {
    it('has reasonable inflation values', () => {
      expect(DEFAULT_INFLATION_FACTORS.medicalInflation).toBeGreaterThan(0);
      expect(DEFAULT_INFLATION_FACTORS.medicalInflation).toBeLessThan(0.15); // Not more than 15%

      expect(DEFAULT_INFLATION_FACTORS.premiumInflation).toBeGreaterThan(0);
      expect(DEFAULT_INFLATION_FACTORS.premiumInflation).toBeLessThan(0.15);

      expect(DEFAULT_INFLATION_FACTORS.generalCPI).toBeGreaterThan(0);
      expect(DEFAULT_INFLATION_FACTORS.generalCPI).toBeLessThan(0.10);
    });
  });

  describe('edge cases', () => {
    it('handles very young age', () => {
      const projection = generateMultiYearProjection({
        currentAge: 18,
        yearsToProject: 5,
        state: 'NC',
      });

      expect(projection.projections).toHaveLength(6);
      expect(projection.projections[0]!.age).toBe(18);
    });

    it('handles senior age', () => {
      const projection = generateMultiYearProjection({
        currentAge: 75,
        yearsToProject: 5,
        state: 'NC',
      });

      expect(projection.projections).toHaveLength(6);
      // Should use Medicare cost structure
      expect(projection.projections[0]!.projectedMonthlyPremium).toBeDefined();
    });

    it('handles projection to exact age with endAge', () => {
      const projection = generateMultiYearProjection({
        currentAge: 60,
        endAge: 65,
        state: 'NC',
      });

      expect(projection.endAge).toBe(65);
      expect(projection.projections[projection.projections.length - 1]!.age).toBe(65);
    });
  });
});
