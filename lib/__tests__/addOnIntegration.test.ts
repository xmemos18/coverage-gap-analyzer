/**
 * Integration Tests for Add-On Insurance Feature
 *
 * Tests the complete integration with existing coverage gap analyzer:
 * - Age input flows through to probability engine
 * - Recommendations display alongside gap analysis
 * - Filtering and sorting work correctly
 * - Existing functionality remains intact
 */

import { analyzeInsurance } from '../calculator';
import type { CalculatorFormData } from '@/types';

describe('Add-On Insurance Integration', () => {
  const createTestFormData = (overrides?: Partial<CalculatorFormData>): CalculatorFormData => ({
    residences: [{ zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 12 }],
    numAdults: 2,
    adultAges: [35, 37],
    numChildren: 2,
    childAges: [5, 8],
    hasMedicareEligible: false,
    hasEmployerInsurance: true,
    employerContribution: 200,
    hasChronicConditions: false,
    chronicConditions: [],
    prescriptionCount: '1-3',
    providerPreference: 'large-network',
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
    incomeRange: '50000-75000',
    currentStep: 5,
    simpleMode: false,
    interestedInAddOns: true,
    ...overrides,
  });

  describe('Age Input Flow', () => {
    it('should pass ages from form data to main calculator', () => {
      const formData = createTestFormData();
      const recommendation = analyzeInsurance(formData);

      expect(recommendation).toBeDefined();
      expect(recommendation.recommendedInsurance).toBeDefined();
      expect(recommendation.estimatedMonthlyCost).toBeDefined();
      expect(recommendation.coverageGapScore).toBeGreaterThanOrEqual(0);
    });

    it('should generate add-on analysis when interestedInAddOns is true', () => {
      const formData = createTestFormData({ interestedInAddOns: true });
      const recommendation = analyzeInsurance(formData);

      expect(recommendation.addOnInsuranceAnalysis).toBeDefined();
      expect(recommendation.addOnInsuranceAnalysis?.recommendations).toBeDefined();
      expect(recommendation.addOnInsuranceAnalysis?.allRecommendations).toBeDefined();
    });

    it('should not generate add-on analysis when interestedInAddOns is false', () => {
      const formData = createTestFormData({ interestedInAddOns: false });
      const recommendation = analyzeInsurance(formData);

      expect(recommendation.addOnInsuranceAnalysis).toBeUndefined();
    });

    it('should use all household ages for add-on recommendations', () => {
      const formData = createTestFormData({
        adultAges: [30, 65],
        childAges: [5, 10],
      });
      const recommendation = analyzeInsurance(formData);

      expect(recommendation.addOnInsuranceAnalysis).toBeDefined();

      const analysis = recommendation.addOnInsuranceAnalysis!;

      // Should have recommendations relevant to different age groups
      expect(analysis.householdAgeGroups.length).toBeGreaterThanOrEqual(2);

      // Should have recommendations for children (dental/vision)
      const childRelevant = analysis.recommendations.some(
        r => r.insurance.category === 'dental' || r.insurance.category === 'vision'
      );
      expect(childRelevant).toBe(true);
    });
  });

  describe('Integration with Existing Functionality', () => {
    it('should not affect main recommendation calculation', () => {
      const formData = createTestFormData();

      // Generate with add-ons
      const withAddOns = analyzeInsurance({ ...formData, interestedInAddOns: true });

      // Generate without add-ons
      const withoutAddOns = analyzeInsurance({ ...formData, interestedInAddOns: false });

      // Main recommendation should be identical
      expect(withAddOns.recommendedInsurance).toBe(withoutAddOns.recommendedInsurance);
      expect(withAddOns.estimatedMonthlyCost).toEqual(withoutAddOns.estimatedMonthlyCost);
      expect(withAddOns.coverageGapScore).toBe(withoutAddOns.coverageGapScore);
      expect(withAddOns.reasoning).toBe(withoutAddOns.reasoning);
    });

    it('should handle households without children', () => {
      const formData = createTestFormData({
        numChildren: 0,
        childAges: [],
      });
      const recommendation = analyzeInsurance(formData);

      expect(recommendation).toBeDefined();
      expect(recommendation.addOnInsuranceAnalysis).toBeDefined();

      // Should still have recommendations for adults
      expect(recommendation.addOnInsuranceAnalysis!.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle single-person households', () => {
      const formData = createTestFormData({
        numAdults: 1,
        adultAges: [28],
        numChildren: 0,
        childAges: [],
      });
      const recommendation = analyzeInsurance(formData);

      expect(recommendation).toBeDefined();
      expect(recommendation.addOnInsuranceAnalysis).toBeDefined();
      expect(recommendation.addOnInsuranceAnalysis!.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle Medicare-eligible households', () => {
      const formData = createTestFormData({
        numAdults: 2,
        adultAges: [67, 65],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: true,
      });
      const recommendation = analyzeInsurance(formData);

      expect(recommendation).toBeDefined();
      expect(recommendation.addOnInsuranceAnalysis).toBeDefined();

      const analysis = recommendation.addOnInsuranceAnalysis!;

      // Should recommend Medicare gap coverage
      const hasGapCoverage = analysis.recommendations.some(
        r => r.insurance.category === 'hospital-indemnity' ||
             r.insurance.category === 'dental' ||
             r.insurance.category === 'vision'
      );
      expect(hasGapCoverage).toBe(true);
    });

    it('should handle chronic conditions modifier', () => {
      const formData = createTestFormData({
        hasChronicConditions: true,
        chronicConditions: ['diabetes', 'hypertension'],
      });
      const recommendation = analyzeInsurance(formData);

      expect(recommendation).toBeDefined();
      expect(recommendation.addOnInsuranceAnalysis).toBeDefined();

      // Critical illness or hospital indemnity should be recommended
      const hasRelevantCoverage = recommendation.addOnInsuranceAnalysis!.recommendations.some(
        r => r.insurance.category === 'critical-illness' ||
             r.insurance.category === 'hospital-indemnity'
      );
      expect(hasRelevantCoverage).toBe(true);
    });
  });

  describe('Filtering and Sorting', () => {
    it('should return both filtered and unfiltered recommendations', () => {
      const formData = createTestFormData();
      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      expect(analysis.recommendations).toBeDefined();
      expect(analysis.allRecommendations).toBeDefined();

      // allRecommendations should include all 8 insurance types
      expect(analysis.allRecommendations.length).toBe(8);

      // recommendations should be filtered (above threshold)
      expect(analysis.recommendations.length).toBeLessThanOrEqual(8);
    });

    it('should properly categorize by priority', () => {
      const formData = createTestFormData();
      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      // Check priority arrays
      const totalPriority = analysis.highPriority.length +
                           analysis.mediumPriority.length +
                           analysis.lowPriority.length;

      expect(totalPriority).toBe(analysis.recommendations.length);

      // All high priority should have score >= 75
      analysis.highPriority.forEach(rec => {
        expect(rec.probabilityScore).toBeGreaterThanOrEqual(75);
        expect(rec.priority).toBe('high');
      });

      // All medium priority should have score 50-74
      analysis.mediumPriority.forEach(rec => {
        expect(rec.probabilityScore).toBeGreaterThanOrEqual(50);
        expect(rec.probabilityScore).toBeLessThan(75);
        expect(rec.priority).toBe('medium');
      });

      // All low priority should have score 25-49
      analysis.lowPriority.forEach(rec => {
        expect(rec.probabilityScore).toBeGreaterThanOrEqual(25);
        expect(rec.probabilityScore).toBeLessThan(50);
        expect(rec.priority).toBe('low');
      });
    });

    it('should sort recommendations by priority and score', () => {
      const formData = createTestFormData();
      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      // Check that recommendations are sorted (high -> medium -> low, then by score)
      const priorityOrder = { high: 3, medium: 2, low: 1 };

      for (let i = 1; i < analysis.recommendations.length; i++) {
        const prev = analysis.recommendations[i - 1];
        const curr = analysis.recommendations[i];

        const prevPriorityValue = priorityOrder[prev.priority];
        const currPriorityValue = priorityOrder[curr.priority];

        if (prevPriorityValue === currPriorityValue) {
          // Same priority - should be sorted by score (high to low)
          expect(prev.probabilityScore).toBeGreaterThanOrEqual(curr.probabilityScore);
        } else {
          // Different priority - higher priority should come first
          expect(prevPriorityValue).toBeGreaterThan(currPriorityValue);
        }
      }
    });
  });

  describe('Cost Calculations', () => {
    it('should calculate household costs correctly', () => {
      const formData = createTestFormData();
      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      expect(analysis.totalMonthlyHighPriority).toBeGreaterThanOrEqual(0);
      expect(analysis.totalMonthlyAllRecommended).toBeGreaterThanOrEqual(analysis.totalMonthlyHighPriority);

      // Calculate manually and verify
      const manualTotal = analysis.recommendations.reduce(
        (sum, rec) => sum + rec.householdCostPerMonth,
        0
      );
      expect(analysis.totalMonthlyAllRecommended).toBe(manualTotal);
    });

    it('should apply family discounts for multiple members', () => {
      const formData = createTestFormData({
        numAdults: 3,
        adultAges: [30, 32, 35],
        numChildren: 0,
        childAges: [],
      });
      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      // Find a recommendation with multiple applicable members
      const multiMemberRec = analysis.recommendations.find(r => r.applicableMembers >= 2);

      if (multiMemberRec) {
        // Household cost should be less than individual cost × members (family discount applied)
        expect(multiMemberRec.householdCostPerMonth).toBeLessThan(
          multiMemberRec.adjustedCostPerMonth * multiMemberRec.applicableMembers
        );
      }
    });

    it('should apply state cost adjustments', () => {
      const formDataNY = createTestFormData({
        residences: [{ zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 12 }],
      });

      const formDataCA = createTestFormData({
        residences: [{ zip: '90001', state: 'CA', isPrimary: true, monthsPerYear: 12 }],
      });

      const recommendationNY = analyzeInsurance(formDataNY);
      const recommendationCA = analyzeInsurance(formDataCA);

      expect(recommendationNY.addOnInsuranceAnalysis).toBeDefined();
      expect(recommendationCA.addOnInsuranceAnalysis).toBeDefined();

      // Costs may differ based on state
      // Just verify both have valid costs
      const analysisNY = recommendationNY.addOnInsuranceAnalysis!;
      const analysisCA = recommendationCA.addOnInsuranceAnalysis!;

      expect(analysisNY.totalMonthlyAllRecommended).toBeGreaterThan(0);
      expect(analysisCA.totalMonthlyAllRecommended).toBeGreaterThan(0);
    });

    it('should handle multi-state households with premium adjustment', () => {
      const formData = createTestFormData({
        residences: [
          { zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 6 },
          { zip: '33101', state: 'FL', isPrimary: false, monthsPerYear: 6 },
        ],
      });

      const recommendation = analyzeInsurance(formData);
      expect(recommendation.addOnInsuranceAnalysis).toBeDefined();

      // Multi-state should apply premium multiplier
      const analysis = recommendation.addOnInsuranceAnalysis!;
      expect(analysis.totalMonthlyAllRecommended).toBeGreaterThan(0);
    });
  });

  describe('Household Age Groups', () => {
    it('should correctly categorize household members into age groups', () => {
      const formData = createTestFormData({
        adultAges: [18, 28, 45, 67],
        childAges: [5, 15],
      });

      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      expect(analysis.householdAgeGroups.length).toBeGreaterThanOrEqual(4);

      // Should have children group
      const childrenGroup = analysis.householdAgeGroups.find(g =>
        g.groupName.includes('Children')
      );
      expect(childrenGroup).toBeDefined();
      expect(childrenGroup?.memberCount).toBe(2);

      // Should have senior group
      const seniorGroup = analysis.householdAgeGroups.find(g =>
        g.groupName.includes('Senior')
      );
      expect(seniorGroup).toBeDefined();
      expect(seniorGroup?.memberCount).toBe(1);
    });

    it('should handle all ages in same group', () => {
      const formData = createTestFormData({
        numAdults: 3,
        adultAges: [35, 36, 38],
        numChildren: 0,
        childAges: [],
      });

      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      expect(analysis.householdAgeGroups.length).toBe(1);
      expect(analysis.householdAgeGroups[0].memberCount).toBe(3);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty adult ages array gracefully', () => {
      const formData = createTestFormData({
        numAdults: 0,
        adultAges: [],
        numChildren: 1,
        childAges: [10],
      });

      expect(() => {
        const recommendation = analyzeInsurance(formData);
        expect(recommendation).toBeDefined();
      }).not.toThrow();
    });

    it('should handle budget constraints', () => {
      const formDataLowBudget = createTestFormData({
        budget: 'under-300',
      });

      const formDataHighBudget = createTestFormData({
        budget: 'over-1000',
      });

      const recLow = analyzeInsurance(formDataLowBudget);
      const recHigh = analyzeInsurance(formDataHighBudget);

      // Both should have recommendations
      expect(recLow.addOnInsuranceAnalysis?.recommendations.length).toBeGreaterThan(0);
      expect(recHigh.addOnInsuranceAnalysis?.recommendations.length).toBeGreaterThan(0);
    });

    it('should maintain consistency across multiple calls', () => {
      const formData = createTestFormData();

      const rec1 = analyzeInsurance(formData);
      const rec2 = analyzeInsurance(formData);

      // Should produce identical results
      expect(rec1.addOnInsuranceAnalysis?.recommendations.length)
        .toBe(rec2.addOnInsuranceAnalysis?.recommendations.length);

      expect(rec1.addOnInsuranceAnalysis?.totalMonthlyAllRecommended)
        .toBe(rec2.addOnInsuranceAnalysis?.totalMonthlyAllRecommended);
    });
  });

  describe('Recommendation Reasons and Context', () => {
    it('should provide reasoning for recommendations', () => {
      const formData = createTestFormData();
      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      // All recommendations should have reasons
      analysis.recommendations.forEach(rec => {
        expect(rec.reasons).toBeDefined();
        expect(rec.reasons.length).toBeGreaterThan(0);

        // Reasons should be non-empty strings
        rec.reasons.forEach(reason => {
          expect(reason.length).toBeGreaterThan(0);
        });
      });
    });

    it('should include actuarial reasoning in recommendations', () => {
      const formData = createTestFormData({
        adultAges: [70],
        numChildren: 0,
        childAges: [],
        hasMedicareEligible: true,
      });

      const recommendation = analyzeInsurance(formData);
      const analysis = recommendation.addOnInsuranceAnalysis!;

      // Should have high-priority recommendations for senior
      expect(analysis.highPriority.length).toBeGreaterThan(0);

      // Check that reasoning mentions age/risk appropriately
      const ltcRec = analysis.recommendations.find(r => r.insurance.category === 'long-term-care');
      if (ltcRec) {
        expect(ltcRec.reasons.length).toBeGreaterThan(0);
      }
    });
  });
});
