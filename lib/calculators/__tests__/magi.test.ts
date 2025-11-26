/**
 * MAGI Optimizer Tests
 */

import {
  analyzeMAGI,
  quickSubsidyCalculator,
  calculateFPLPercent,
  getIncomeAtFPL,
  isMedicaidExpansionState,
  type MAGIOptimizerInput,
} from '../magi';

describe('MAGI Optimizer', () => {
  // Helper to create base input
  const createBaseInput = (overrides: Partial<MAGIOptimizerInput> = {}): MAGIOptimizerInput => ({
    estimatedMAGI: 50000,
    householdSize: 2,
    filingStatus: 'married_joint',
    state: 'CA',
    age: 40,
    benchmarkPremium: 500,
    currentRetirementContributions: 5000,
    currentHSAContributions: 2000,
    has401kAccess: true,
    hasHDHP: true,
    ...overrides,
  });

  describe('analyzeMAGI', () => {
    it('should return comprehensive analysis', () => {
      const input = createBaseInput();
      const analysis = analyzeMAGI(input);

      expect(analysis).toBeDefined();
      expect(analysis.current).toBeDefined();
      expect(analysis.breakpoints).toBeDefined();
      expect(analysis.optimal).toBeDefined();
      expect(analysis.strategies).toBeDefined();
      expect(analysis.cliffAnalysis).toBeDefined();
      expect(analysis.warnings).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should calculate current FPL percentage correctly', () => {
      const input = createBaseInput({
        estimatedMAGI: 39440, // 200% FPL for household of 2
        householdSize: 2,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.current.fplPercent).toBe(200);
    });

    it('should identify Medicaid tier in expansion states', () => {
      const input = createBaseInput({
        estimatedMAGI: 20000, // Below 138% FPL
        householdSize: 2,
        state: 'CA', // Expansion state
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.current.tier).toBe('medicaid');
    });

    it('should identify subsidy tier for moderate income', () => {
      const input = createBaseInput({
        estimatedMAGI: 50000,
        householdSize: 2,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.current.tier).toBe('subsidy');
    });

    it('should identify cliff tier for income near 400% FPL', () => {
      const input = createBaseInput({
        estimatedMAGI: 82000, // ~415% FPL for household of 2
        householdSize: 2,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.current.tier).toBe('cliff');
    });

    it('should calculate monthly and annual subsidies', () => {
      const input = createBaseInput({
        estimatedMAGI: 40000,
        benchmarkPremium: 600,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.current.monthlySubsidy).toBeGreaterThan(0);
      // Allow for small rounding differences (monthly and annual are rounded separately)
      const expectedAnnual = analysis.current.monthlySubsidy * 12;
      expect(Math.abs(analysis.current.annualSubsidy - expectedAnnual)).toBeLessThanOrEqual(12);
    });

    it('should generate breakpoints at key FPL levels', () => {
      const input = createBaseInput();
      const analysis = analyzeMAGI(input);

      const fplLevels = analysis.breakpoints.map((b) => b.fplPercent);
      expect(fplLevels).toContain(100);
      expect(fplLevels).toContain(200);
      expect(fplLevels).toContain(400);
    });

    it('should include strategies for MAGI reduction', () => {
      const input = createBaseInput({
        estimatedMAGI: 70000,
        has401kAccess: true,
        hasHDHP: true,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.strategies.length).toBeGreaterThan(0);
      expect(analysis.strategies.some((s) => s.name.includes('401(k)'))).toBe(true);
      expect(analysis.strategies.some((s) => s.name.includes('HSA'))).toBe(true);
    });
  });

  describe('Subsidy Calculations', () => {
    it('should provide no subsidy below 100% FPL', () => {
      const input = createBaseInput({
        estimatedMAGI: 10000,
        householdSize: 1,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.current.monthlySubsidy).toBe(0);
    });

    it('should provide higher subsidy at lower incomes', () => {
      const lowIncome = createBaseInput({
        estimatedMAGI: 25000,
        householdSize: 2,
        benchmarkPremium: 600,
      });
      const higherIncome = createBaseInput({
        estimatedMAGI: 60000,
        householdSize: 2,
        benchmarkPremium: 600,
      });

      const lowAnalysis = analyzeMAGI(lowIncome);
      const highAnalysis = analyzeMAGI(higherIncome);

      expect(lowAnalysis.current.monthlySubsidy).toBeGreaterThan(
        highAnalysis.current.monthlySubsidy
      );
    });

    it('should calculate effective premium correctly', () => {
      const input = createBaseInput({
        estimatedMAGI: 40000,
        benchmarkPremium: 500,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.current.effectivePremium).toBe(
        Math.max(0, 500 - analysis.current.monthlySubsidy)
      );
    });
  });

  describe('Cliff Analysis', () => {
    it('should detect when near cliff', () => {
      const input = createBaseInput({
        estimatedMAGI: 76000, // ~385% FPL for household of 2
        householdSize: 2,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.cliffAnalysis.nearCliff).toBe(true);
    });

    it('should not flag cliff risk for lower incomes', () => {
      const input = createBaseInput({
        estimatedMAGI: 40000,
        householdSize: 2,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.cliffAnalysis.nearCliff).toBe(false);
    });

    it('should calculate distance from cliff', () => {
      const input = createBaseInput({
        estimatedMAGI: 50000,
        householdSize: 2,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.cliffAnalysis.distanceFromCliff).toBeGreaterThan(0);
      expect(analysis.cliffAnalysis.cliffAmount).toBeGreaterThan(input.estimatedMAGI);
    });

    it('should estimate subsidy at risk', () => {
      const input = createBaseInput({
        estimatedMAGI: 75000,
        householdSize: 2,
        benchmarkPremium: 600,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.cliffAnalysis.subsidyAtRisk).toBeGreaterThan(0);
    });
  });

  describe('MAGI Reduction Strategies', () => {
    it('should recommend 401(k) when available', () => {
      const input = createBaseInput({
        has401kAccess: true,
        currentRetirementContributions: 5000,
      });
      const analysis = analyzeMAGI(input);

      const strategy401k = analysis.strategies.find((s) => s.name.includes('401(k)'));
      expect(strategy401k).toBeDefined();
      expect(strategy401k?.applicable).toBe(true);
    });

    it('should mark 401(k) as not applicable when no access', () => {
      const input = createBaseInput({
        has401kAccess: false,
      });
      const analysis = analyzeMAGI(input);

      const strategy401k = analysis.strategies.find((s) => s.name.includes('401(k)'));
      expect(strategy401k).toBeDefined();
      expect(strategy401k?.applicable).toBe(false);
      expect(strategy401k?.notApplicableReason).toBe('No 401(k) access');
    });

    it('should include HSA strategy when HDHP eligible', () => {
      const input = createBaseInput({
        hasHDHP: true,
      });
      const analysis = analyzeMAGI(input);

      const hsaStrategy = analysis.strategies.find((s) => s.name.includes('HSA'));
      expect(hsaStrategy).toBeDefined();
      expect(hsaStrategy?.applicable).toBe(true);
    });

    it('should mark HSA as not applicable without HDHP', () => {
      const input = createBaseInput({
        hasHDHP: false,
      });
      const analysis = analyzeMAGI(input);

      const hsaStrategy = analysis.strategies.find((s) => s.name.includes('HSA'));
      expect(hsaStrategy).toBeDefined();
      expect(hsaStrategy?.applicable).toBe(false);
    });

    it('should include IRA strategy for all users', () => {
      const input = createBaseInput();
      const analysis = analyzeMAGI(input);

      const iraStrategy = analysis.strategies.find((s) => s.name.includes('IRA'));
      expect(iraStrategy).toBeDefined();
      expect(iraStrategy?.applicable).toBe(true);
    });

    it('should include catch-up contributions for age 50+', () => {
      const input = createBaseInput({
        age: 55,
        has401kAccess: true,
        currentRetirementContributions: 0,
      });
      const analysis = analyzeMAGI(input);

      const strategy401k = analysis.strategies.find((s) => s.name.includes('401(k)'));
      // Max should include catch-up: $23,000 + $7,500
      expect(strategy401k?.maxReduction).toBe(30500);
    });

    it('should include self-employment deductions if applicable', () => {
      const input = createBaseInput({
        selfEmploymentIncome: 50000,
      });
      const analysis = analyzeMAGI(input);

      const seStrategy = analysis.strategies.find((s) => s.name.includes('Self-Employment'));
      expect(seStrategy).toBeDefined();
      expect(seStrategy?.maxReduction).toBeGreaterThan(0);
    });
  });

  describe('Optimal MAGI Finding', () => {
    it('should find target MAGI for increased subsidy', () => {
      const input = createBaseInput({
        estimatedMAGI: 65000,
        householdSize: 2,
        benchmarkPremium: 600,
      });
      const analysis = analyzeMAGI(input);

      // Should potentially recommend a lower MAGI
      expect(analysis.optimal).toBeDefined();
      expect(analysis.optimal.targetMAGI).toBeLessThanOrEqual(input.estimatedMAGI);
    });

    it('should calculate reduction needed', () => {
      const input = createBaseInput({
        estimatedMAGI: 75000,
        householdSize: 2,
      });
      const analysis = analyzeMAGI(input);

      if (analysis.optimal.reductionNeeded > 0) {
        expect(analysis.optimal.targetMAGI).toBeLessThan(input.estimatedMAGI);
        expect(analysis.optimal.additionalAnnualSubsidy).toBeGreaterThan(0);
      }
    });

    it('should not recommend reduction when no benefit', () => {
      const input = createBaseInput({
        estimatedMAGI: 30000,
        householdSize: 2,
        benchmarkPremium: 300, // Low premium means less subsidy potential
      });
      const analysis = analyzeMAGI(input);

      // At low income with low premium, reduction may not be beneficial
      expect(analysis.optimal.targetMAGI).toBeLessThanOrEqual(input.estimatedMAGI);
    });
  });

  describe('Warnings and Recommendations', () => {
    it('should warn about Medicaid eligibility', () => {
      const input = createBaseInput({
        estimatedMAGI: 18000,
        householdSize: 2,
        state: 'CA',
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.warnings.some((w) => w.toLowerCase().includes('medicaid'))).toBe(true);
    });

    it('should warn about married filing separately', () => {
      const input = createBaseInput({
        filingStatus: 'married_separate',
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.warnings.some((w) => w.toLowerCase().includes('married separately'))).toBe(true);
    });

    it('should warn about coverage gap in non-expansion states', () => {
      const input = createBaseInput({
        estimatedMAGI: 10000,
        householdSize: 1,
        state: 'TX', // Non-expansion state
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.warnings.some((w) => w.toLowerCase().includes('coverage gap'))).toBe(true);
    });

    it('should always include tax professional disclaimer', () => {
      const input = createBaseInput();
      const analysis = analyzeMAGI(input);

      expect(analysis.warnings.some((w) => w.toLowerCase().includes('tax professional'))).toBe(true);
    });

    it('should generate recommendations when reduction is beneficial', () => {
      const input = createBaseInput({
        estimatedMAGI: 70000,
        householdSize: 2,
        benchmarkPremium: 700,
        has401kAccess: true,
        hasHDHP: true,
      });
      const analysis = analyzeMAGI(input);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('quickSubsidyCalculator', () => {
    it('should calculate subsidy for given inputs', () => {
      const result = quickSubsidyCalculator(50000, 2, 500);

      expect(result).toBeDefined();
      expect(result.fplPercent).toBeGreaterThan(0);
      expect(result.monthlySubsidy).toBeGreaterThanOrEqual(0);
      // Allow for small rounding differences (monthly and annual are rounded separately)
      const expectedAnnual = result.monthlySubsidy * 12;
      expect(Math.abs(result.annualSubsidy - expectedAnnual)).toBeLessThanOrEqual(12);
    });

    it('should calculate effective premium', () => {
      const benchmarkPremium = 600;
      const result = quickSubsidyCalculator(40000, 2, benchmarkPremium);

      expect(result.effectiveMonthlyPremium).toBe(
        Math.max(0, benchmarkPremium - result.monthlySubsidy)
      );
    });

    it('should return zero subsidy below 100% FPL', () => {
      const result = quickSubsidyCalculator(10000, 1, 500);

      expect(result.monthlySubsidy).toBe(0);
    });
  });

  describe('calculateFPLPercent', () => {
    it('should calculate correct FPL percentage for household of 1', () => {
      // 2024 FPL for 1 person is $14,580
      const fplPercent = calculateFPLPercent(14580, 1);
      expect(fplPercent).toBe(100);
    });

    it('should calculate correct FPL percentage for household of 2', () => {
      // 2024 FPL for 2 people is $19,720
      const fplPercent = calculateFPLPercent(39440, 2);
      expect(fplPercent).toBe(200);
    });

    it('should calculate for larger households', () => {
      // 2024 FPL for 4 people is $30,000
      const fplPercent = calculateFPLPercent(60000, 4);
      expect(fplPercent).toBe(200);
    });

    it('should handle households larger than 8', () => {
      // FPL for 9 should be $50,560 + $5,140 = $55,700
      const fplPercent = calculateFPLPercent(55700, 9);
      expect(fplPercent).toBe(100);
    });
  });

  describe('getIncomeAtFPL', () => {
    it('should return income at 100% FPL', () => {
      const income = getIncomeAtFPL(100, 1);
      expect(income).toBe(14580);
    });

    it('should return income at 200% FPL', () => {
      const income = getIncomeAtFPL(200, 2);
      expect(income).toBe(39440);
    });

    it('should return income at 400% FPL', () => {
      const income = getIncomeAtFPL(400, 1);
      expect(income).toBe(58320);
    });
  });

  describe('isMedicaidExpansionState', () => {
    it('should return true for expansion states', () => {
      expect(isMedicaidExpansionState('CA')).toBe(true);
      expect(isMedicaidExpansionState('NY')).toBe(true);
      expect(isMedicaidExpansionState('OH')).toBe(true);
    });

    it('should return false for non-expansion states', () => {
      expect(isMedicaidExpansionState('TX')).toBe(false);
      expect(isMedicaidExpansionState('FL')).toBe(false);
      expect(isMedicaidExpansionState('GA')).toBe(false);
    });

    it('should handle lowercase state codes', () => {
      expect(isMedicaidExpansionState('ca')).toBe(true);
      expect(isMedicaidExpansionState('tx')).toBe(false);
    });
  });

  describe('Breakpoints', () => {
    it('should provide income amounts at each breakpoint', () => {
      const input = createBaseInput({ householdSize: 2 });
      const analysis = analyzeMAGI(input);

      const breakpoint200 = analysis.breakpoints.find((b) => b.fplPercent === 200);
      expect(breakpoint200?.incomeAtFPL).toBe(39440);
    });

    it('should show decreasing subsidies as income increases', () => {
      const input = createBaseInput({
        benchmarkPremium: 600,
        householdSize: 2,
      });
      const analysis = analyzeMAGI(input);

      const subsidy150 = analysis.breakpoints.find((b) => b.fplPercent === 150);
      const subsidy400 = analysis.breakpoints.find((b) => b.fplPercent === 400);

      expect(subsidy150?.monthlySubsidy).toBeGreaterThan(subsidy400?.monthlySubsidy || 0);
    });

    it('should show increasing contribution percentages', () => {
      const input = createBaseInput({ householdSize: 2 });
      const analysis = analyzeMAGI(input);

      const contrib150 = analysis.breakpoints.find((b) => b.fplPercent === 150);
      const contrib400 = analysis.breakpoints.find((b) => b.fplPercent === 400);

      expect(contrib400?.expectedContributionPercent).toBeGreaterThan(
        contrib150?.expectedContributionPercent || 0
      );
    });
  });
});
