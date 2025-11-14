/**
 * Tests for Advanced Subsidy Calculator
 * Validates MAGI, PTC, CSR, and Medicaid calculations
 */

import {
  calculateFPL,
  calculateMAGI,
  getAffordabilityPercentage,
  getCSRLevel,
  calculatePremiumTaxCredit,
  analyzeFamilyGlitch,
  getTaxReconciliationWarning,
  estimateMAGIFromRange,
  MEDICAID_EXPANSION_STATES,
  FPL_2025,
} from '../advanced-subsidy';

describe('Advanced Subsidy Calculator', () => {
  describe('calculateFPL', () => {
    test('calculates FPL for contiguous states correctly', () => {
      expect(calculateFPL(1, 'TX')).toBe(15060); // Individual
      expect(calculateFPL(2, 'NC')).toBe(20510); // 15060 + 5450
      expect(calculateFPL(4, 'OH')).toBe(31410); // 15060 + (3 * 5450)
    });

    test('calculates higher FPL for Alaska', () => {
      const akFPL = calculateFPL(1, 'AK');
      const txFPL = calculateFPL(1, 'TX');

      expect(akFPL).toBe(18840);
      expect(akFPL).toBeGreaterThan(txFPL);
    });

    test('calculates higher FPL for Hawaii', () => {
      const hiFPL = calculateFPL(1, 'HI');
      const caFPL = calculateFPL(1, 'CA');

      expect(hiFPL).toBe(17310);
      expect(hiFPL).toBeGreaterThan(caFPL);
    });

    test('handles large families', () => {
      const family8 = calculateFPL(8, 'FL');
      // 15060 + (7 * 5450) = 53210
      expect(family8).toBe(53210);
    });

    test('handles edge cases', () => {
      expect(calculateFPL(0, 'TX')).toBe(FPL_2025.BASE); // Min 1 person
      expect(calculateFPL(-1, 'NY')).toBe(FPL_2025.BASE); // Negative clamped
      expect(calculateFPL(1.7, 'CA')).toBe(FPL_2025.BASE); // Fractional rounded down
    });
  });

  describe('calculateMAGI', () => {
    test('calculates MAGI from wages only', () => {
      const magi = calculateMAGI({ wages: 50000 });
      expect(magi).toBe(50000);
    });

    test('adds multiple income sources', () => {
      const magi = calculateMAGI({
        wages: 40000,
        selfEmploymentIncome: 10000,
        investmentIncome: 2000,
      });
      expect(magi).toBe(52000);
    });

    test('includes tax-exempt interest (add-back)', () => {
      const magi = calculateMAGI({
        wages: 50000,
        taxExemptInterest: 1000, // Municipal bond interest
      });
      expect(magi).toBe(51000); // Added back for MAGI
    });

    test('subtracts student loan interest deduction', () => {
      const magi = calculateMAGI({
        wages: 50000,
        studentLoanInterest: 2500,
      });
      expect(magi).toBe(47500);
    });

    test('subtracts IRA contribution', () => {
      const magi = calculateMAGI({
        wages: 60000,
        iraContribution: 6500,
      });
      expect(magi).toBe(53500);
    });

    test('complex scenario with multiple components', () => {
      const magi = calculateMAGI({
        wages: 45000,
        selfEmploymentIncome: 10000,
        socialSecurityTaxable: 5000,
        investmentIncome: 3000,
        taxExemptInterest: 500,         // Add back
        nonTaxableSocialSecurity: 5000, // Add back
        studentLoanInterest: 2000,      // Deduct
        healthSavingsAccount: 3850,     // Deduct
        iraContribution: 5000,          // Deduct
      });

      // (45000 + 10000 + 5000 + 3000) + (500 + 5000) - (2000 + 3850 + 5000)
      // 63000 + 5500 - 10850 = 57650
      expect(magi).toBe(57650);
    });

    test('handles negative result (minimum 0)', () => {
      const magi = calculateMAGI({
        wages: 10000,
        iraContribution: 15000, // More than income
      });
      expect(magi).toBe(0); // Can't be negative
    });

    test('handles empty components', () => {
      const magi = calculateMAGI({});
      expect(magi).toBe(0);
    });
  });

  describe('getAffordabilityPercentage', () => {
    test('returns 0% for income 0-150% FPL', () => {
      expect(getAffordabilityPercentage(100)).toBe(0.00);
      expect(getAffordabilityPercentage(150)).toBe(0.00);
    });

    test('returns low percentages for 150-200% FPL', () => {
      expect(getAffordabilityPercentage(175)).toBe(0.00);
      expect(getAffordabilityPercentage(200)).toBe(0.00);
    });

    test('increases with income 200-400% FPL', () => {
      expect(getAffordabilityPercentage(225)).toBe(0.02); // 200-250%
      expect(getAffordabilityPercentage(275)).toBe(0.04); // 250-300%
      expect(getAffordabilityPercentage(325)).toBe(0.06); // 300-350%
      expect(getAffordabilityPercentage(375)).toBe(0.08); // 350-400%
    });

    test('caps at 8.5% above 400% FPL (IRA 2022 enhancement)', () => {
      expect(getAffordabilityPercentage(450)).toBe(0.085);
      expect(getAffordabilityPercentage(500)).toBe(0.085);
      expect(getAffordabilityPercentage(1000)).toBe(0.085); // No cliff!
    });

    test('handles edge cases', () => {
      expect(getAffordabilityPercentage(0)).toBe(0.00);
      expect(getAffordabilityPercentage(400.1)).toBe(0.085);
    });
  });

  describe('getCSRLevel', () => {
    test('returns high CSR for very low income (≤150% FPL)', () => {
      expect(getCSRLevel(100, 'Silver')).toBe('94%');
      expect(getCSRLevel(150, 'Silver')).toBe('94%');
    });

    test('returns medium CSR for 150-200% FPL', () => {
      expect(getCSRLevel(175, 'Silver')).toBe('87%');
      expect(getCSRLevel(200, 'Silver')).toBe('87%');
    });

    test('returns low CSR for 200-250% FPL', () => {
      expect(getCSRLevel(225, 'Silver')).toBe('73%');
      expect(getCSRLevel(250, 'Silver')).toBe('73%');
    });

    test('returns None for income >250% FPL', () => {
      expect(getCSRLevel(275, 'Silver')).toBe('None');
      expect(getCSRLevel(400, 'Silver')).toBe('None');
    });

    test('returns None for non-Silver plans', () => {
      expect(getCSRLevel(100, 'Bronze')).toBe('None');
      expect(getCSRLevel(100, 'Gold')).toBe('None');
      expect(getCSRLevel(150, 'Platinum')).toBe('None');
    });

    test('CSR only available for Silver', () => {
      expect(getCSRLevel(100, 'Silver')).toBe('94%');
      expect(getCSRLevel(100, 'Gold')).toBe('None'); // Better benefits, but no CSR
    });
  });

  describe('calculatePremiumTaxCredit', () => {
    test('identifies Medicaid eligibility in expansion state', () => {
      const result = calculatePremiumTaxCredit(
        20000, // MAGI
        1,     // Household size
        'CA',  // Expansion state
        400    // SLCSP
      );

      // 20000 / 15060 = 132% FPL (below 138% threshold)
      expect(result.medicaidEligible).toBe(true);
      expect(result.medicaidExpansionState).toBe(true);
      expect(result.ptcEligible).toBe(false); // Medicaid, not PTC
      expect(result.monthlyPTC).toBe(0);
    });

    test('identifies coverage gap in non-expansion state', () => {
      const result = calculatePremiumTaxCredit(
        18000, // MAGI
        1,
        'TX',  // Non-expansion state
        400
      );

      // 18000 / 15060 = 120% FPL (100-138%, in gap)
      expect(result.medicaidEligible).toBe(false);
      expect(result.medicaidExpansionState).toBe(false);
      expect(result.inCoverageGap).toBe(true);
      expect(result.ptcEligible).toBe(false); // In gap, no subsidies
    });

    test('calculates substantial PTC for low income (150% FPL)', () => {
      const fpl = calculateFPL(1, 'NC');
      const magi = fpl * 1.5; // 150% FPL = $22,590
      const slcsp = 400;

      const result = calculatePremiumTaxCredit(magi, 1, 'NC', slcsp);

      expect(result.fplPercentage).toBeCloseTo(150, 0);
      expect(result.ptcEligible).toBe(true);
      expect(result.affordabilityPercentage).toBe(0.00); // 0% for 150% FPL
      expect(result.maxContribution).toBe(0); // Should pay $0
      expect(result.monthlyPTC).toBe(slcsp); // Full subsidy
      expect(result.csrLevel).toBe('94%'); // High CSR
    });

    test('calculates moderate PTC for middle income (250% FPL)', () => {
      const fpl = calculateFPL(2, 'FL');
      const magi = fpl * 2.5; // 250% FPL
      const slcsp = 800;

      const result = calculatePremiumTaxCredit(magi, 2, 'FL', slcsp);

      expect(result.fplPercentage).toBeCloseTo(250, 0);
      expect(result.ptcEligible).toBe(true);
      expect(result.affordabilityPercentage).toBe(0.02); // 2% for 200-250% FPL (250 is upper bound)
      expect(result.maxContribution).toBeCloseTo((magi / 12) * 0.02, 0);
      expect(result.monthlyPTC).toBeGreaterThan(0);
      expect(result.monthlyPTC).toBeLessThan(slcsp);
      expect(result.csrLevel).toBe('73%');
    });

    test('calculates small PTC for high income (450% FPL)', () => {
      const fpl = calculateFPL(3, 'NY');
      const magi = fpl * 4.5; // 450% FPL
      const slcsp = 1200;

      const result = calculatePremiumTaxCredit(magi, 3, 'NY', slcsp);

      expect(result.fplPercentage).toBeCloseTo(450, 0);
      expect(result.ptcEligible).toBe(true); // No cliff!
      expect(result.affordabilityPercentage).toBe(0.085); // Capped at 8.5%
      expect(result.maxContribution).toBeCloseTo((magi / 12) * 0.085, 0);
      expect(result.monthlyPTC).toBeGreaterThan(0); // Still gets subsidy
      expect(result.csrLevel).toBe('None');
    });

    test('no PTC for very high income (1000% FPL)', () => {
      const fpl = calculateFPL(1, 'CA');
      const magi = fpl * 10; // 1000% FPL
      const slcsp = 500;

      const result = calculatePremiumTaxCredit(magi, 1, 'CA', slcsp);

      // Even at 1000% FPL, IRA 2022 allows subsidies capped at 8.5%
      expect(result.ptcEligible).toBe(true);
      expect(result.affordabilityPercentage).toBe(0.085);

      // But subsidy will be $0 because max contribution exceeds premium
      const maxContribution = (magi / 12) * 0.085;
      expect(maxContribution).toBeGreaterThan(slcsp); // Can afford full price
      expect(result.monthlyPTC).toBe(0); // No subsidy needed
    });

    test('family of 4 at 200% FPL gets nearly free coverage', () => {
      const fpl = calculateFPL(4, 'OH');
      const magi = fpl * 2; // 200% FPL
      const slcsp = 1500;

      const result = calculatePremiumTaxCredit(magi, 4, 'OH', slcsp, 'Silver');

      expect(result.ptcEligible).toBe(true);
      expect(result.affordabilityPercentage).toBe(0.00); // 0% for 200% FPL
      expect(result.monthlyPTC).toBe(slcsp); // Full subsidy
      expect(result.afterSubsidyCostLow).toBe(0); // Bronze free
      expect(result.csrLevel).toBe('87%');
      expect(result.recommendations.some(r => r.includes('free or nearly-free'))).toBe(true);
    });

    test('annual PTC calculation', () => {
      const result = calculatePremiumTaxCredit(30000, 1, 'TX', 400);

      expect(result.annualPTC).toBe(result.monthlyPTC * 12);
    });

    test('generates warnings for high subsidies', () => {
      // Use 150% FPL to get PTC eligibility (above Medicaid threshold)
      const fpl = calculateFPL(1, 'OH');
      const magi = fpl * 1.5; // 150% FPL
      const result = calculatePremiumTaxCredit(magi, 1, 'OH', 400);

      expect(result.ptcEligible).toBe(true); // Above 138%, eligible for PTC
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('very high'))).toBe(true);
    });

    test('generates CSR recommendations', () => {
      const result = calculatePremiumTaxCredit(25000, 1, 'NC', 400, 'Silver');

      expect(result.csrLevel).not.toBe('None');
      expect(result.recommendations.some(r => r.includes('Cost-Sharing Reductions'))).toBe(true);
    });
  });

  describe('analyzeFamilyGlitch', () => {
    const magi = 60000; // $60k income

    test('identifies fixed family glitch scenario', () => {
      const result = analyzeFamilyGlitch(
        magi,
        250,  // Affordable self-only ($250/month)
        800   // Unaffordable family ($800/month)
      );

      const threshold = (magi / 12) * 0.0839; // ~$419/month

      expect(result.employerSelfOnlyAffordable).toBe(true);  // $250 < $419
      expect(result.employerFamilyAffordable).toBe(false);   // $800 > $419
      expect(result.familyCanGetSubsidies).toBe(true);       // Family glitch fixed!
      expect(result.explanation).toContain('family glitch');
      expect(result.explanation).toContain('family members (spouse/children) CAN get marketplace subsidies');
    });

    test('self-only unaffordable, entire household eligible', () => {
      const result = analyzeFamilyGlitch(
        magi,
        500,  // Unaffordable self-only
        1200  // Unaffordable family
      );

      expect(result.employerSelfOnlyAffordable).toBe(false);
      expect(result.familyCanGetSubsidies).toBe(true); // Entire household eligible
      expect(result.explanation).toContain('entire household');
    });

    test('both affordable, should use employer coverage', () => {
      const result = analyzeFamilyGlitch(
        magi,
        200,  // Affordable self-only
        400   // Affordable family
      );

      expect(result.employerSelfOnlyAffordable).toBe(true);
      expect(result.employerFamilyAffordable).toBe(true);
      expect(result.familyCanGetSubsidies).toBe(false); // Should use employer
      expect(result.explanation).toContain('should use employer coverage');
    });

    test('calculates affordability threshold correctly', () => {
      const result = analyzeFamilyGlitch(magi, 250, 800);

      const expectedThreshold = (magi / 12) * 0.0839;
      expect(result.affordabilityThreshold).toBeCloseTo(expectedThreshold, 0);
    });
  });

  describe('getTaxReconciliationWarning', () => {
    test('no warning for small income difference (<5%)', () => {
      const warning = getTaxReconciliationWarning(
        50000, // Projected
        51000, // Actual (2% difference)
        300    // Monthly PTC
      );

      expect(warning).toBeNull();
    });

    test('warns about repayment when income higher than projected', () => {
      const warning = getTaxReconciliationWarning(
        50000, // Projected
        60000, // Actual (20% higher)
        400    // Monthly PTC
      );

      expect(warning).not.toBeNull();
      expect(warning).toContain('may need to repay');
      expect(warning).toContain('20%');
      expect(warning).toContain('tax bill');
    });

    test('notifies about potential refund when income lower', () => {
      const warning = getTaxReconciliationWarning(
        60000, // Projected
        50000, // Actual (16.7% lower)
        300    // Monthly PTC
      );

      expect(warning).not.toBeNull();
      expect(warning).toContain('additional');
      expect(warning).toContain('tax credit');
      expect(warning).toContain('lower');
    });

    test('estimates repayment amount', () => {
      const monthlyPTC = 500;
      const warning = getTaxReconciliationWarning(
        40000, // Projected
        48000, // Actual (20% higher)
        monthlyPTC
      );

      // 20% difference * $6000 annual = ~$1200 owed
      expect(warning).toContain('$1,200');
    });
  });

  describe('estimateMAGIFromRange', () => {
    test('returns midpoint for income ranges', () => {
      expect(estimateMAGIFromRange('under-30k')).toBe(25000);
      expect(estimateMAGIFromRange('30k-50k')).toBe(40000);
      expect(estimateMAGIFromRange('50k-75k')).toBe(62500);
      expect(estimateMAGIFromRange('75k-100k')).toBe(87500);
      expect(estimateMAGIFromRange('100k-150k')).toBe(125000);
      expect(estimateMAGIFromRange('150k-plus')).toBe(175000);
    });

    test('returns default for unknown range', () => {
      expect(estimateMAGIFromRange('unknown')).toBe(50000);
      expect(estimateMAGIFromRange('')).toBe(50000);
    });
  });

  describe('Real-World Scenarios', () => {
    test('young single person, low income (Medicaid)', () => {
      const result = calculatePremiumTaxCredit(
        18000, // $18k/year
        1,
        'CA',  // Expansion state
        350
      );

      expect(result.medicaidEligible).toBe(true);
      expect(result.monthlyPTC).toBe(0); // Medicaid, not PTC
      expect(result.recommendations.some(r => r.includes('Medicaid'))).toBe(true);
    });

    test('family of 4, moderate income (high subsidies + CSR)', () => {
      const result = calculatePremiumTaxCredit(
        55000, // $55k for family of 4
        4,
        'OH',
        1400,
        'Silver'
      );

      // ~175% FPL, should get excellent subsidies
      expect(result.fplPercentage).toBeLessThan(200);
      expect(result.ptcEligible).toBe(true);
      expect(result.csrLevel).toBe('87%');
      expect(result.monthlyPTC).toBeGreaterThan(1000); // Substantial subsidy
    });

    test('high-income couple (minimal subsidy)', () => {
      const result = calculatePremiumTaxCredit(
        200000, // $200k
        2,
        'NY',
        1000
      );

      // ~487% FPL, but still eligible (no cliff)
      expect(result.ptcEligible).toBe(true);
      expect(result.csrLevel).toBe('None');

      // Max contribution = $200k / 12 * 0.085 = $1,417/month
      // Since that exceeds $1000 premium, PTC = $0
      expect(result.monthlyPTC).toBe(0);
    });

    test('coverage gap victim in Texas', () => {
      const result = calculatePremiumTaxCredit(
        17000, // $17k
        1,
        'TX',  // Non-expansion
        400
      );

      // ~113% FPL in TX (non-expansion)
      expect(result.inCoverageGap).toBe(true);
      expect(result.medicaidEligible).toBe(false);
      expect(result.ptcEligible).toBe(false);
      expect(result.warnings.some(w => w.includes('coverage gap'))).toBe(true);
    });
  });
});
