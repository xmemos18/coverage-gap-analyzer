/**
 * HSA Calculator Tests
 */

import {
  calculateHSAOptimization,
  validateHDHPEligibility,
  calculatePaycheckContribution,
  estimateRetirementHealthcareCosts,
  getHSALimits,
  calculateTaxEquivalentYield,
  type HSAInput,
} from '../hsa';

describe('HSA Calculator', () => {
  // Helper to create base input
  const createBaseInput = (overrides: Partial<HSAInput> = {}): HSAInput => ({
    coverageType: 'individual',
    age: 40,
    currentBalance: 5000,
    annualIncome: 80000,
    federalTaxRate: 0.22,
    stateTaxRate: 0.05,
    employerContribution: 500,
    expectedExpenses: 2000,
    monthlyPremium: 200,
    deductible: 2000,
    yearsToRetirement: 25,
    expectedReturn: 0.07,
    healthcareInflation: 0.05,
    ...overrides,
  });

  describe('calculateHSAOptimization', () => {
    it('should return comprehensive analysis', () => {
      const input = createBaseInput();
      const analysis = calculateHSAOptimization(input);

      expect(analysis).toBeDefined();
      expect(analysis.limits).toBeDefined();
      expect(analysis.taxSavings).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.projections).toBeDefined();
    });

    it('should calculate correct individual limits', () => {
      const input = createBaseInput({ coverageType: 'individual' });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.limits.baseLimit).toBe(4150);
      expect(analysis.limits.totalLimit).toBe(4150);
    });

    it('should calculate correct family limits', () => {
      const input = createBaseInput({ coverageType: 'family' });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.limits.baseLimit).toBe(8300);
      expect(analysis.limits.totalLimit).toBe(8300);
    });

    it('should include catch-up contribution for age 55+', () => {
      const input = createBaseInput({ age: 55 });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.limits.catchUpContribution).toBe(1000);
      expect(analysis.limits.totalLimit).toBe(5150); // 4150 + 1000
      expect(analysis.catchUpEligible).toBe(true);
    });

    it('should not include catch-up for under 55', () => {
      const input = createBaseInput({ age: 54 });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.limits.catchUpContribution).toBe(0);
      expect(analysis.catchUpEligible).toBe(false);
    });

    it('should subtract employer contribution from max employee contribution', () => {
      const input = createBaseInput({
        coverageType: 'individual',
        employerContribution: 1000,
      });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.limits.employerContribution).toBe(1000);
      expect(analysis.limits.maxEmployeeContribution).toBe(3150); // 4150 - 1000
    });

    it('should calculate federal tax savings', () => {
      const input = createBaseInput({
        federalTaxRate: 0.22,
        employerContribution: 0,
      });
      const analysis = calculateHSAOptimization(input);

      // Max contribution of $4,150 * 22% = $913
      expect(analysis.taxSavings.federalTaxSavings).toBeGreaterThan(0);
    });

    it('should calculate state tax savings', () => {
      const input = createBaseInput({
        stateTaxRate: 0.05,
        employerContribution: 0,
      });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.taxSavings.stateTaxSavings).toBeGreaterThan(0);
    });

    it('should calculate FICA savings', () => {
      const input = createBaseInput({ employerContribution: 0 });
      const analysis = calculateHSAOptimization(input);

      // FICA rate is 7.65%
      expect(analysis.taxSavings.ficaSavings).toBeGreaterThan(0);
    });

    it('should generate projections for years to retirement', () => {
      const input = createBaseInput({ yearsToRetirement: 10 });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.projections.length).toBe(10);
    });

    it('should show balance growth over time', () => {
      const input = createBaseInput({
        yearsToRetirement: 5,
        currentBalance: 10000,
        expectedExpenses: 0, // No expenses to see pure growth
      });
      const analysis = calculateHSAOptimization(input);

      const firstYear = analysis.projections[0];
      const lastYear = analysis.projections[analysis.projections.length - 1];

      expect(lastYear?.endingBalance).toBeGreaterThan(firstYear?.beginningBalance || 0);
    });

    it('should include recommendations', () => {
      const input = createBaseInput();
      const analysis = calculateHSAOptimization(input);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should include FSA comparison', () => {
      const input = createBaseInput();
      const analysis = calculateHSAOptimization(input);

      expect(analysis.fsaComparison).toBeDefined();
      expect(analysis.fsaComparison.hsaAdvantage.length).toBeGreaterThan(0);
      expect(analysis.fsaComparison.fsaAdvantage.length).toBeGreaterThan(0);
    });
  });

  describe('Tax Savings Calculations', () => {
    it('should calculate effective cost per dollar', () => {
      const input = createBaseInput({
        federalTaxRate: 0.22,
        stateTaxRate: 0.05,
        employerContribution: 0,
      });
      const analysis = calculateHSAOptimization(input);

      // Effective cost should be less than $1 per dollar contributed
      expect(analysis.taxSavings.effectiveCostPerDollar).toBeLessThan(1);
      expect(analysis.taxSavings.effectiveCostPerDollar).toBeGreaterThan(0);
    });

    it('should show higher tax savings at higher tax brackets', () => {
      const lowBracket = createBaseInput({
        federalTaxRate: 0.12,
        employerContribution: 0,
      });
      const highBracket = createBaseInput({
        federalTaxRate: 0.32,
        employerContribution: 0,
      });

      const lowAnalysis = calculateHSAOptimization(lowBracket);
      const highAnalysis = calculateHSAOptimization(highBracket);

      expect(highAnalysis.taxSavings.federalTaxSavings).toBeGreaterThan(
        lowAnalysis.taxSavings.federalTaxSavings
      );
    });
  });

  describe('validateHDHPEligibility', () => {
    it('should validate eligible HDHP', () => {
      const result = validateHDHPEligibility('individual', 2000, 7000);

      expect(result.eligible).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should reject deductible below minimum', () => {
      const result = validateHDHPEligibility('individual', 1000, 7000);

      expect(result.eligible).toBe(false);
      expect(result.issues.some(i => i.includes('Deductible'))).toBe(true);
    });

    it('should reject OOP max above limit', () => {
      const result = validateHDHPEligibility('individual', 2000, 10000);

      expect(result.eligible).toBe(false);
      expect(result.issues.some(i => i.includes('Out-of-pocket'))).toBe(true);
    });

    it('should use family limits for family coverage', () => {
      // Family min deductible is $3,200
      const result = validateHDHPEligibility('family', 2500, 10000);

      expect(result.eligible).toBe(false);
      expect(result.issues.some(i => i.includes('3200'))).toBe(true);
    });

    it('should allow higher family OOP max', () => {
      // Family max OOP is $16,100
      const result = validateHDHPEligibility('family', 4000, 15000);

      expect(result.eligible).toBe(true);
    });
  });

  describe('calculatePaycheckContribution', () => {
    it('should calculate biweekly contribution', () => {
      const annual = 4150;
      const perPaycheck = calculatePaycheckContribution(annual, 26);

      expect(perPaycheck).toBeCloseTo(159.62, 1);
    });

    it('should calculate monthly contribution', () => {
      const annual = 4150;
      const monthly = calculatePaycheckContribution(annual, 12);

      expect(monthly).toBeCloseTo(345.84, 1);
    });

    it('should round up to ensure full contribution', () => {
      const annual = 4150;
      const perPaycheck = calculatePaycheckContribution(annual, 26);

      // Per paycheck * 26 should equal or exceed annual
      expect(perPaycheck * 26).toBeGreaterThanOrEqual(annual);
    });
  });

  describe('estimateRetirementHealthcareCosts', () => {
    it('should estimate costs from retirement to life expectancy', () => {
      const result = estimateRetirementHealthcareCosts(50, 65, 5000);

      expect(result.yearlyEstimates.length).toBe(21); // Age 65-85
      expect(result.totalLifetimeCost).toBeGreaterThan(0);
    });

    it('should apply healthcare inflation', () => {
      const result = estimateRetirementHealthcareCosts(50, 65, 5000, 0.05);

      const atRetirement = result.yearlyEstimates.find(e => e.age === 65);
      const at85 = result.yearlyEstimates.find(e => e.age === 85);

      expect(at85?.estimatedCost).toBeGreaterThan(atRetirement?.estimatedCost || 0);
    });

    it('should account for years from current age', () => {
      const result = estimateRetirementHealthcareCosts(40, 65, 5000, 0.05);

      // 25 years of inflation from age 40 to 65
      const atRetirement = result.yearlyEstimates.find(e => e.age === 65);
      // $5000 * (1.05)^25 ≈ $16,932
      expect(atRetirement?.estimatedCost).toBeGreaterThan(15000);
    });
  });

  describe('getHSALimits', () => {
    it('should return 2024 limits', () => {
      const limits = getHSALimits(2024);

      expect(limits.individual).toBe(4150);
      expect(limits.family).toBe(8300);
      expect(limits.catchUp).toBe(1000);
    });

    it('should return 2023 limits', () => {
      const limits = getHSALimits(2023);

      expect(limits.individual).toBe(3850);
      expect(limits.family).toBe(7750);
    });

    it('should default to 2024 for future years', () => {
      const limits = getHSALimits(2025);

      expect(limits.individual).toBe(4150);
    });
  });

  describe('calculateTaxEquivalentYield', () => {
    it('should calculate higher equivalent yield', () => {
      // 7% HSA return with 22% federal tax
      const equivalent = calculateTaxEquivalentYield(0.07, 0.22);

      // 7% / (1 - 0.22) = 8.97%
      expect(equivalent).toBeCloseTo(0.0897, 2);
    });

    it('should include state taxes', () => {
      const federal = calculateTaxEquivalentYield(0.07, 0.22, 0);
      const withState = calculateTaxEquivalentYield(0.07, 0.22, 0.05);

      expect(withState).toBeGreaterThan(federal);
    });

    it('should show higher equivalent at higher tax rates', () => {
      const lowTax = calculateTaxEquivalentYield(0.07, 0.12);
      const highTax = calculateTaxEquivalentYield(0.07, 0.32);

      expect(highTax).toBeGreaterThan(lowTax);
    });
  });

  describe('Projections', () => {
    it('should track balance growth correctly', () => {
      const input = createBaseInput({
        currentBalance: 10000,
        yearsToRetirement: 3,
        expectedExpenses: 0,
        expectedReturn: 0.10,
        employerContribution: 0,
      });
      const analysis = calculateHSAOptimization(input);

      // Year 1: $10,000 beginning + contribution + 10% growth
      const year1 = analysis.projections[0];
      expect(year1?.beginningBalance).toBe(10000);
      expect(year1?.investmentGrowth).toBe(1000); // 10% of $10,000
    });

    it('should subtract expenses from balance', () => {
      const input = createBaseInput({
        currentBalance: 10000,
        yearsToRetirement: 1,
        expectedExpenses: 5000,
        expectedReturn: 0,
        employerContribution: 0,
      });
      const analysis = calculateHSAOptimization(input);

      const year1 = analysis.projections[0];
      expect(year1?.expensesPaid).toBe(5000);
    });

    it('should include employer contribution in total', () => {
      const input = createBaseInput({
        employerContribution: 1000,
        yearsToRetirement: 1,
      });
      const analysis = calculateHSAOptimization(input);

      const year1 = analysis.projections[0];
      // Total contribution should include employer
      expect(year1?.contribution).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Recommendations', () => {
    it('should recommend maximizing for higher income', () => {
      const input = createBaseInput({ annualIncome: 100000 });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.recommendations.some(r => r.toLowerCase().includes('maximize'))).toBe(true);
    });

    it('should warn about non-HDHP deductible', () => {
      const input = createBaseInput({
        coverageType: 'individual',
        deductible: 1000, // Below $1,600 minimum
      });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.recommendations.some(r => r.toLowerCase().includes('warning'))).toBe(true);
    });

    it('should mention catch-up for those approaching 55', () => {
      const input = createBaseInput({ age: 52 });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.recommendations.some(r => r.includes('catch-up'))).toBe(true);
    });

    it('should recommend investment for healthy balances', () => {
      const input = createBaseInput({ currentBalance: 10000 });
      const analysis = calculateHSAOptimization(input);

      expect(analysis.recommendations.some(r => r.toLowerCase().includes('invest'))).toBe(true);
    });
  });
});
