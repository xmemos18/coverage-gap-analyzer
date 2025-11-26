/**
 * Monte Carlo Simulation Tests
 */

import {
  runMonteCarlo,
  generateMonteCarloAnalysis,
  simulatePlanCosts,
  comparePlansWithMonteCarlo,
  type MonteCarloInput,
} from '../monte-carlo';

describe('Monte Carlo Simulation', () => {
  // Use fixed seed for reproducibility
  const testSeed = 12345;

  describe('runMonteCarlo', () => {
    it('should return results with all required fields', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      expect(result).toHaveProperty('median');
      expect(result).toHaveProperty('mean');
      expect(result).toHaveProperty('standardDeviation');
      expect(result).toHaveProperty('percentiles');
      expect(result).toHaveProperty('probabilityOfExceedingDeductible');
      expect(result).toHaveProperty('probabilityOfHittingOOPMax');
      expect(result).toHaveProperty('expectedValueAtRisk');
      expect(result).toHaveProperty('simulationCount');
      expect(result).toHaveProperty('executionTimeMs');
    });

    it('should return consistent results with same seed', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const result1 = runMonteCarlo(input);
      const result2 = runMonteCarlo(input);

      expect(result1.median).toBe(result2.median);
      expect(result1.mean).toBe(result2.mean);
      expect(result1.percentiles.p50).toBe(result2.percentiles.p50);
    });

    it('should have ordered percentiles (p5 <= p25 <= p50 <= p75 <= p95)', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 1000, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      expect(result.percentiles.p5).toBeLessThanOrEqual(result.percentiles.p25);
      expect(result.percentiles.p25).toBeLessThanOrEqual(result.percentiles.p50);
      expect(result.percentiles.p50).toBeLessThanOrEqual(result.percentiles.p75);
      expect(result.percentiles.p75).toBeLessThanOrEqual(result.percentiles.p95);
    });

    it('should cap costs at out-of-pocket maximum', () => {
      const input: MonteCarloInput = {
        baseCost: 50000, // Very high base cost
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 1000, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      // All percentiles should be <= OOP max
      expect(result.percentiles.p99).toBeLessThanOrEqual(input.outOfPocketMax);
      expect(result.expectedValueAtRisk).toBeLessThanOrEqual(input.outOfPocketMax);
    });

    it('should report higher deductible exceedance for higher base costs', () => {
      const lowCostInput: MonteCarloInput = {
        baseCost: 1000,
        deductible: 5000,
        outOfPocketMax: 8000,
        config: { iterations: 1000, seed: testSeed },
      };

      const highCostInput: MonteCarloInput = {
        baseCost: 10000,
        deductible: 5000,
        outOfPocketMax: 8000,
        config: { iterations: 1000, seed: testSeed },
      };

      const lowCostResult = runMonteCarlo(lowCostInput);
      const highCostResult = runMonteCarlo(highCostInput);

      expect(highCostResult.probabilityOfExceedingDeductible).toBeGreaterThan(
        lowCostResult.probabilityOfExceedingDeductible
      );
    });

    it('should track execution time', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.simulationCount).toBe(100);
    });

    it('should produce reasonable mean for typical healthcare costs', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 1000, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      // Mean should be positive and less than OOP max
      expect(result.mean).toBeGreaterThan(0);
      expect(result.mean).toBeLessThanOrEqual(input.outOfPocketMax);
    });
  });

  describe('generateMonteCarloAnalysis', () => {
    it('should return full analysis with interpretation', async () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const analysis = await generateMonteCarloAnalysis(input);

      expect(analysis).toHaveProperty('result');
      expect(analysis).toHaveProperty('interpretation');
      expect(analysis).toHaveProperty('histogramData');
      expect(analysis).toHaveProperty('inputParameters');
    });

    it('should provide risk level assessment', async () => {
      const input: MonteCarloInput = {
        baseCost: 10000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const analysis = await generateMonteCarloAnalysis(input);

      expect(['low', 'moderate', 'high', 'very-high']).toContain(
        analysis.interpretation.riskLevel
      );
    });

    it('should include insights and recommendations', async () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const analysis = await generateMonteCarloAnalysis(input);

      expect(analysis.interpretation.insights.length).toBeGreaterThan(0);
      expect(typeof analysis.interpretation.summary).toBe('string');
      expect(analysis.interpretation.summary.length).toBeGreaterThan(0);
    });

    it('should generate histogram data', async () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const analysis = await generateMonteCarloAnalysis(input);

      expect(analysis.histogramData.length).toBeGreaterThan(0);
      analysis.histogramData.forEach((bucket) => {
        expect(bucket).toHaveProperty('label');
        expect(bucket).toHaveProperty('min');
        expect(bucket).toHaveProperty('max');
        expect(bucket).toHaveProperty('percentage');
      });
    });

    it('should recommend HSA for HDHP-qualifying deductibles', async () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 3200, // HDHP minimum for 2024
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const analysis = await generateMonteCarloAnalysis(input);

      const hasHSARecommendation = analysis.interpretation.recommendations.some(
        (rec) => rec.toLowerCase().includes('hsa')
      );
      expect(hasHSARecommendation).toBe(true);
    });
  });

  describe('simulatePlanCosts', () => {
    it('should simulate bronze plan correctly', async () => {
      const analysis = await simulatePlanCosts(5000, 'bronze');

      expect(analysis.inputParameters.deductible).toBe(7000);
      expect(analysis.inputParameters.outOfPocketMax).toBe(9450);
    });

    it('should simulate silver plan correctly', async () => {
      const analysis = await simulatePlanCosts(5000, 'silver');

      expect(analysis.inputParameters.deductible).toBe(5000);
      expect(analysis.inputParameters.outOfPocketMax).toBe(9450);
    });

    it('should simulate gold plan correctly', async () => {
      const analysis = await simulatePlanCosts(5000, 'gold');

      expect(analysis.inputParameters.deductible).toBe(1500);
      expect(analysis.inputParameters.outOfPocketMax).toBe(8700);
    });

    it('should simulate platinum plan correctly', async () => {
      const analysis = await simulatePlanCosts(5000, 'platinum');

      expect(analysis.inputParameters.deductible).toBe(500);
      expect(analysis.inputParameters.outOfPocketMax).toBe(4000);
    });

    it('should simulate HDHP correctly', async () => {
      const analysis = await simulatePlanCosts(5000, 'hdhp');

      expect(analysis.inputParameters.deductible).toBe(3200);
      expect(analysis.inputParameters.outOfPocketMax).toBe(8050);
    });
  });

  describe('comparePlansWithMonteCarlo', () => {
    it('should compare two plans and identify differences', async () => {
      const plan1 = {
        name: 'Bronze Plan',
        deductible: 7000,
        outOfPocketMax: 9450,
        monthlyPremium: 250,
      };

      const plan2 = {
        name: 'Silver Plan',
        deductible: 5000,
        outOfPocketMax: 9450,
        monthlyPremium: 400,
      };

      const comparison = await comparePlansWithMonteCarlo(5000, plan1, plan2);

      expect(comparison).toHaveProperty('plan1Analysis');
      expect(comparison).toHaveProperty('plan2Analysis');
      expect(comparison).toHaveProperty('comparison');
      expect(comparison.comparison).toHaveProperty('expectedTotalCostDifference');
      expect(comparison.comparison).toHaveProperty('betterPlanForLowUtilization');
      expect(comparison.comparison).toHaveProperty('betterPlanForHighUtilization');
      expect(comparison.comparison).toHaveProperty('breakEvenCost');
    });

    it('should identify bronze as better for low utilization', async () => {
      const bronzePlan = {
        name: 'Bronze',
        deductible: 7000,
        outOfPocketMax: 9450,
        monthlyPremium: 200,
      };

      const platinumPlan = {
        name: 'Platinum',
        deductible: 500,
        outOfPocketMax: 4000,
        monthlyPremium: 800,
      };

      // Very low expected costs
      const comparison = await comparePlansWithMonteCarlo(500, bronzePlan, platinumPlan);

      // Bronze should be better for low utilization due to lower premiums
      expect(comparison.comparison.betterPlanForLowUtilization).toBe('Bronze');
    });

    it('should run both analyses in parallel', async () => {
      const plan1 = {
        name: 'Plan A',
        deductible: 3000,
        outOfPocketMax: 8000,
        monthlyPremium: 300,
      };

      const plan2 = {
        name: 'Plan B',
        deductible: 5000,
        outOfPocketMax: 8000,
        monthlyPremium: 250,
      };

      const startTime = Date.now();
      await comparePlansWithMonteCarlo(5000, plan1, plan2);
      const duration = Date.now() - startTime;

      // Should complete quickly since they run in parallel
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('edge cases', () => {
    it('should handle zero base cost', () => {
      const input: MonteCarloInput = {
        baseCost: 0,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      expect(result.mean).toBeGreaterThanOrEqual(0);
    });

    it('should handle very high base cost', () => {
      const input: MonteCarloInput = {
        baseCost: 1000000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      // Most results should hit OOP max
      expect(result.probabilityOfHittingOOPMax).toBeGreaterThan(50);
    });

    it('should handle deductible higher than OOP max', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 10000,
        outOfPocketMax: 8000,
        config: { iterations: 100, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      // All costs should be capped at OOP max
      expect(result.percentiles.p99).toBeLessThanOrEqual(8000);
    });

    it('should handle small iteration count', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 10, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      expect(result.simulationCount).toBe(10);
    });

    it('should handle large iteration count', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 10000, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      expect(result.simulationCount).toBe(10000);
    });
  });

  describe('statistical properties', () => {
    it('should have standard deviation > 0 for non-zero costs', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 1000, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      expect(result.standardDeviation).toBeGreaterThan(0);
    });

    it('should have median close to mean for symmetric distributions', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 1000, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      // For lognormal, median is typically less than mean
      // This test verifies they're in reasonable proximity
      const diff = Math.abs(result.median - result.mean);
      expect(diff).toBeLessThan(result.mean * 0.5); // Within 50%
    });

    it('should have probabilities between 0 and 100', () => {
      const input: MonteCarloInput = {
        baseCost: 5000,
        deductible: 2000,
        outOfPocketMax: 8000,
        config: { iterations: 1000, seed: testSeed },
      };

      const result = runMonteCarlo(input);

      expect(result.probabilityOfExceedingDeductible).toBeGreaterThanOrEqual(0);
      expect(result.probabilityOfExceedingDeductible).toBeLessThanOrEqual(100);
      expect(result.probabilityOfHittingOOPMax).toBeGreaterThanOrEqual(0);
      expect(result.probabilityOfHittingOOPMax).toBeLessThanOrEqual(100);
    });
  });
});
