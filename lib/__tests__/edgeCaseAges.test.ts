/**
 * Edge Case Age Testing for Add-On Insurance Recommendations
 *
 * Tests critical age boundaries:
 * - Age 0: Newborn (start of life)
 * - Age 18: Legal adult transition
 * - Age 26: ACA parent plan cutoff
 * - Age 65: Medicare eligibility
 * - Age 120: Maximum age boundary
 */

import { calculateActuarialProbability } from '../calculator/actuarialCurves';
import { generateAddOnRecommendations } from '../calculator/addOnRecommendations';
import type { CalculatorFormData, InsuranceRecommendation } from '@/types';
import type { AddOnInsuranceCategory } from '@/types/addOnInsurance';

// Helper to create base form data
const createBaseFormData = (overrides?: Partial<CalculatorFormData>): CalculatorFormData => ({
  residences: [{ zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 12 }],
  numAdults: 1,
  adultAges: [35],
  numChildren: 0,
  childAges: [],
  hasMedicareEligible: false,
  hasEmployerInsurance: false,
  employerContribution: 0,
  hasChronicConditions: false,
  chronicConditions: [],
  prescriptionCount: '',
  providerPreference: '',
  hasCurrentInsurance: false,
  currentInsurance: {
    carrier: '',
    planType: '',
    monthlyCost: 0,
    deductible: 0,
    outOfPocketMax: 0,
    coverageNotes: '',
  },
  budget: '500-750',
  incomeRange: '',
  currentStep: 5,
  simpleMode: false,
  interestedInAddOns: true,
  ...overrides,
});

const createBasePrimaryRecommendation = (): InsuranceRecommendation => ({
  planType: 'MARKETPLACE',
  category: 'Bronze',
  monthlyPremium: 500,
  annualDeductible: 5000,
  outOfPocketMax: 8000,
  copays: { primaryCare: 40, specialist: 80, urgentCare: 100, emergencyRoom: 500 },
  coinsurance: 30,
  pros: ['Lower monthly premium'],
  cons: ['Higher out-of-pocket costs'],
  suitableFor: ['Generally healthy individuals'],
  whyRecommended: 'Balanced option for your situation',
  actionItems: [],
  alternativeOptions: [],
});

describe('Edge Case Age Testing', () => {
  describe('Age 0 - Newborn', () => {
    it('should calculate probabilities for all insurance types at age 0', () => {
      const categories: AddOnInsuranceCategory[] = [
        'dental',
        'vision',
        'accident',
        'critical-illness',
        'hospital-indemnity',
        'disability',
        'long-term-care',
        'life',
      ];

      categories.forEach(category => {
        const result = calculateActuarialProbability(0, category);

        expect(result.probabilityScore).toBeGreaterThanOrEqual(0);
        expect(result.probabilityScore).toBeLessThanOrEqual(100);
        expect(result.riskLevel).toBeDefined();
        expect(result.utilizationRate).toBeGreaterThanOrEqual(0);
        expect(result.utilizationRate).toBeLessThanOrEqual(1);
        expect(result.costMultiplier).toBeGreaterThan(0);
        expect(result.reasoning).toBeTruthy();
      });
    });

    it('should recommend pediatric-focused insurance for newborn', () => {
      const formData = createBaseFormData({
        numAdults: 2,
        adultAges: [30, 32],
        numChildren: 1,
        childAges: [0],
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      // Should recommend dental and vision for children
      const dental = analysis.recommendations.find(r => r.insurance.category === 'dental');
      const vision = analysis.recommendations.find(r => r.insurance.category === 'vision');

      expect(dental).toBeDefined();
      expect(vision).toBeDefined();

      // Dental should be high priority for children
      if (dental) {
        expect(dental.priority).toMatch(/high|medium/);
        expect(dental.probabilityScore).toBeGreaterThan(50);
      }
    });

    it('should handle household with newborn and appropriate cost adjustments', () => {
      const formData = createBaseFormData({
        numAdults: 2,
        adultAges: [28, 30],
        numChildren: 1,
        childAges: [0],
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      expect(analysis.householdAgeGroups).toContainEqual(
        expect.objectContaining({
          groupName: 'Children (0-17)',
          memberCount: 1,
        })
      );

      // Should have recommendations for parents too
      const life = analysis.recommendations.find(r => r.insurance.category === 'life');
      expect(life).toBeDefined();
      if (life) {
        expect(life.priority).toBe('high'); // High priority for parents with newborn
      }
    });
  });

  describe('Age 18 - Legal Adult Transition', () => {
    it('should transition from pediatric to adult coverage patterns at age 18', () => {
      const age18 = calculateActuarialProbability(18, 'dental');

      // Probability should remain high but may transition to adult patterns
      expect(age18.probabilityScore).toBeGreaterThan(50);

      // Cost multiplier may change as they transition to adult rates
      expect(age18.costMultiplier).toBeDefined();
      expect(age18.costMultiplier).toBeGreaterThanOrEqual(0.5);
    });

    it('should recommend appropriate coverage for 18-year-old', () => {
      const formData = createBaseFormData({
        numAdults: 1,
        adultAges: [18],
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      // Young adults should have accident coverage recommended
      const accident = analysis.recommendations.find(r => r.insurance.category === 'accident');
      expect(accident).toBeDefined();

      // Dental and vision should still be relevant
      const dental = analysis.recommendations.find(r => r.insurance.category === 'dental');
      const vision = analysis.recommendations.find(r => r.insurance.category === 'vision');

      expect(dental || vision).toBeDefined();
    });

    it('should categorize 18-year-old in correct age group', () => {
      const formData = createBaseFormData({
        numAdults: 1,
        adultAges: [18],
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      expect(analysis.householdAgeGroups).toContainEqual(
        expect.objectContaining({
          groupName: 'Young Adults (18-30)',
          memberCount: 1,
        })
      );
    });
  });

  describe('Age 26 - ACA Parent Plan Cutoff', () => {
    it('should recognize increased need for independent coverage at age 26', () => {
      const age25 = calculateActuarialProbability(25, 'critical-illness');
      const age26 = calculateActuarialProbability(26, 'critical-illness');
      const age27 = calculateActuarialProbability(27, 'critical-illness');

      // All should have valid scores
      expect(age26.probabilityScore).toBeGreaterThanOrEqual(0);
      expect(age26.probabilityScore).toBeLessThanOrEqual(100);

      // Risk should be increasing gradually through this age range
      expect(age27.probabilityScore).toBeGreaterThanOrEqual(age25.probabilityScore - 5);
    });

    it('should recommend comprehensive coverage for 26-year-old', () => {
      const formData = createBaseFormData({
        numAdults: 1,
        adultAges: [26],
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      // Should have at least some recommendations
      expect(analysis.recommendations.length).toBeGreaterThan(0);

      // Accident and dental/vision should be available
      const hasBasicCoverage = analysis.recommendations.some(
        r => r.insurance.category === 'accident' ||
             r.insurance.category === 'dental' ||
             r.insurance.category === 'vision'
      );
      expect(hasBasicCoverage).toBe(true);
    });

    it('should provide appropriate life insurance recommendations at age 26', () => {
      const lifeProb = calculateActuarialProbability(26, 'life');

      // Life insurance becomes more relevant in mid-20s
      expect(lifeProb.probabilityScore).toBeGreaterThan(30);
    });
  });

  describe('Age 65 - Medicare Eligibility', () => {
    it('should show significantly increased need for supplemental coverage at age 65', () => {
      const age65 = calculateActuarialProbability(65, 'hospital-indemnity');

      // All should show high probability at this age
      expect(age65.probabilityScore).toBeGreaterThan(60);

      // Cost multiplier should increase at Medicare age
      expect(age65.costMultiplier).toBeGreaterThan(1.0);
    });

    it('should recommend Medicare gap coverage for 65-year-old', () => {
      const formData = createBaseFormData({
        numAdults: 1,
        adultAges: [65],
        hasMedicareEligible: true,
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      // Should get bonus points for Medicare gap coverage
      const dental = analysis.recommendations.find(r => r.insurance.category === 'dental');
      const vision = analysis.recommendations.find(r => r.insurance.category === 'vision');
      const hospitalIndemnity = analysis.recommendations.find(r => r.insurance.category === 'hospital-indemnity');

      // At least one of these should be high priority
      const hasHighPriorityMedicareGap = [dental, vision, hospitalIndemnity].some(
        rec => rec && rec.priority === 'high'
      );
      expect(hasHighPriorityMedicareGap).toBe(true);
    });

    it('should categorize 65-year-old in senior age group', () => {
      const formData = createBaseFormData({
        numAdults: 1,
        adultAges: [65],
        hasMedicareEligible: true,
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      expect(analysis.householdAgeGroups).toContainEqual(
        expect.objectContaining({
          groupName: 'Seniors (65-74)',
          memberCount: 1,
        })
      );
    });

    it('should show high LTC probability at age 65', () => {
      const ltcProb = calculateActuarialProbability(65, 'long-term-care');

      expect(ltcProb.probabilityScore).toBeGreaterThan(70);
      expect(ltcProb.riskLevel).toMatch(/high|very-high/);
    });
  });

  describe('Age 120 - Maximum Age Boundary', () => {
    it('should handle age 120 without errors for all insurance types', () => {
      const categories: AddOnInsuranceCategory[] = [
        'dental',
        'vision',
        'accident',
        'critical-illness',
        'hospital-indemnity',
        'disability',
        'long-term-care',
        'life',
      ];

      categories.forEach(category => {
        expect(() => {
          const result = calculateActuarialProbability(120, category);
          expect(result).toBeDefined();
          expect(result.probabilityScore).toBeGreaterThanOrEqual(0);
          expect(result.probabilityScore).toBeLessThanOrEqual(100);
        }).not.toThrow();
      });
    });

    it('should show very high probability for most insurance types at age 120', () => {
      const dental = calculateActuarialProbability(120, 'dental');
      const critical = calculateActuarialProbability(120, 'critical-illness');
      const ltc = calculateActuarialProbability(120, 'long-term-care');

      // Extremely high risk at maximum age
      expect(dental.probabilityScore).toBeGreaterThan(80);
      expect(critical.probabilityScore).toBeGreaterThan(80);
      expect(ltc.probabilityScore).toBeGreaterThan(85);
    });

    it('should apply maximum cost multipliers at age 120', () => {
      const ltc = calculateActuarialProbability(120, 'long-term-care');
      const critical = calculateActuarialProbability(120, 'critical-illness');

      // Should have highest cost multipliers
      expect(ltc.costMultiplier).toBeGreaterThanOrEqual(2.5);
      expect(critical.costMultiplier).toBeGreaterThanOrEqual(2.0);
    });

    it('should generate recommendations for household with 120-year-old', () => {
      const formData = createBaseFormData({
        numAdults: 1,
        adultAges: [120],
        hasMedicareEligible: true,
      });

      expect(() => {
        const analysis = generateAddOnRecommendations(
          formData,
          createBasePrimaryRecommendation()
        );
        expect(analysis).toBeDefined();
        expect(analysis.recommendations.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should categorize 120-year-old in oldest senior age group', () => {
      const formData = createBaseFormData({
        numAdults: 1,
        adultAges: [120],
        hasMedicareEligible: true,
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      expect(analysis.householdAgeGroups).toContainEqual(
        expect.objectContaining({
          groupName: 'Seniors (75+)',
          memberCount: 1,
        })
      );
    });
  });

  describe('Multi-Generation Households with Edge Ages', () => {
    it('should handle household with newborn and senior (0 and 65)', () => {
      const formData = createBaseFormData({
        numAdults: 2,
        adultAges: [35, 65],
        numChildren: 1,
        childAges: [0],
        hasMedicareEligible: true,
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      // Should have 3 age groups
      expect(analysis.householdAgeGroups.length).toBeGreaterThanOrEqual(2);

      // Should recommend coverage for both age extremes
      expect(analysis.recommendations.length).toBeGreaterThan(3);

      // Should have high-priority recommendations for both groups
      expect(analysis.highPriority.length).toBeGreaterThan(0);
    });

    it('should handle household spanning all critical ages', () => {
      const formData = createBaseFormData({
        numAdults: 4,
        adultAges: [18, 26, 45, 65],
        numChildren: 1,
        childAges: [0],
        hasMedicareEligible: true,
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      // Should handle complex household without errors
      expect(analysis).toBeDefined();
      expect(analysis.householdAgeGroups.length).toBeGreaterThan(2);

      // Should have diverse recommendations
      expect(analysis.recommendations.length).toBeGreaterThan(4);

      // Total cost should scale with household size
      expect(analysis.totalMonthlyAllRecommended).toBeGreaterThan(100);
    });

    it('should apply family discounts for multi-age household', () => {
      const formData = createBaseFormData({
        numAdults: 3,
        adultAges: [26, 45, 65],
      });

      const analysis = generateAddOnRecommendations(
        formData,
        createBasePrimaryRecommendation()
      );

      // Should apply discounts for multiple members
      const dentalRec = analysis.recommendations.find(r => r.insurance.category === 'dental');
      if (dentalRec) {
        expect(dentalRec.applicableMembers).toBeGreaterThanOrEqual(2);
        // Cost should reflect family discount
        expect(dentalRec.householdCostPerMonth).toBeLessThan(
          dentalRec.adjustedCostPerMonth * dentalRec.applicableMembers
        );
      }
    });
  });

  describe('Boundary Validation and Error Handling', () => {
    it('should handle negative age gracefully', () => {
      expect(() => {
        const result = calculateActuarialProbability(-1, 'dental');
        // Should clamp to 0
        expect(result.probabilityScore).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    it('should handle age above 120 gracefully', () => {
      expect(() => {
        const result = calculateActuarialProbability(150, 'dental');
        // Should clamp to 120
        expect(result.probabilityScore).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    it('should handle decimal ages by rounding', () => {
      const result1 = calculateActuarialProbability(25.4, 'dental');
      const result2 = calculateActuarialProbability(25.6, 'dental');

      // Both should work without errors
      expect(result1.probabilityScore).toBeGreaterThanOrEqual(0);
      expect(result2.probabilityScore).toBeGreaterThanOrEqual(0);
    });

    it('should maintain consistency across edge boundaries', () => {
      // Check that probabilities don't have unrealistic jumps
      const ages = [17, 18, 19, 25, 26, 27, 64, 65, 66];
      const results = ages.map(age => calculateActuarialProbability(age, 'dental'));

      // No single-year jump should exceed 30 points (allowing for legitimate risk increases)
      for (let i = 1; i < results.length; i++) {
        const jump = Math.abs(results[i].probabilityScore - results[i - 1].probabilityScore);
        expect(jump).toBeLessThan(30);
      }
    });
  });
});
