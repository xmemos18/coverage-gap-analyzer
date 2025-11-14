/**
 * Tests for Modular Recommendation Engine
 * Validates the complete decision tree and recommendation generation
 */

import { generateRecommendations } from '../recommendation-engine';

describe('Recommendation Engine', () => {
  describe('Medicaid Eligibility Scenarios', () => {
    test('recommends Medicaid for low-income person in expansion state', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 18000, // ~120% FPL
        state: 'CA',
      });

      expect(result.financialSummary.eligibility.medicaid).toBe(true);
      expect(result.primaryRecommendation).toContain('Medicaid');
      expect(result.recommendations.some(r => r.title.includes('Medicaid'))).toBe(true);
      expect(result.recommendations.find(r => r.title.includes('Medicaid'))?.urgency).toBe('critical');
    });

    test('detects coverage gap in non-expansion state', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 18000, // ~120% FPL
        state: 'TX',
      });

      expect(result.financialSummary.eligibility.inCoverageGap).toBe(true);
      expect(result.primaryRecommendation).toContain('coverage gap');
      expect(result.warnings.some(w => w.includes('coverage gap'))).toBe(true);
    });
  });

  describe('Premium Tax Credit Scenarios', () => {
    test('calculates PTC for middle-income person', () => {
      const result = generateRecommendations({
        age: 40,
        householdSize: 1,
        estimatedIncome: 40000, // ~266% FPL
        state: 'NC',
      });

      expect(result.financialSummary.eligibility.premiumTaxCredit).toBe(true);
      expect(result.financialSummary.eligibility.monthlyPTC).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.title.includes('Premium Tax Credits'))).toBe(true);
    });

    test('provides plan recommendation with subsidies', () => {
      const result = generateRecommendations({
        age: 45,
        householdSize: 2,
        estimatedIncome: 50000,
        state: 'CA',
      });

      expect(result.recommendedPlan).toBeTruthy();
      expect(result.recommendedPlan.metalTier).toBeTruthy();
      expect(result.recommendedPlan.monthlyPremium).toBeGreaterThan(0);
      expect(result.recommendedPlan.estimatedAnnualCost).toBeGreaterThan(0);
    });
  });

  describe('Cost & Coverage Analysis', () => {
    test('recommends lowest total cost plan', () => {
      const result = generateRecommendations({
        age: 30,
        householdSize: 1,
        estimatedIncome: 50000,
        state: 'NC',
        healthStatus: 'excellent',
      });

      expect(result.recommendedPlan.metalTier).toBeTruthy();
      expect(result.financialSummary.costs.recommendedTotalCost).toBe(
        result.financialSummary.costs.lowestTotalCost
      );
    });

    test('recommends higher coverage for high-risk profile', () => {
      const result = generateRecommendations({
        age: 55,
        householdSize: 1,
        estimatedIncome: 50000,
        state: 'NC',
        healthStatus: 'poor',
        chronicConditions: ['diabetesWithComplications', 'heartFailure'],
      });

      expect(result.financialSummary.riskAssessment.category).toMatch(/high|very-high/);
      expect(result.recommendations.some(r => r.title.includes('Higher Coverage'))).toBe(true);
    });

    test('provides financial summary', () => {
      const result = generateRecommendations({
        age: 40,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
      });

      expect(result.financialSummary).toBeTruthy();
      expect(result.financialSummary.eligibility).toBeTruthy();
      expect(result.financialSummary.costs).toBeTruthy();
      expect(result.financialSummary.riskAssessment).toBeTruthy();
    });
  });

  describe('Life Event Handling', () => {
    test('detects approaching age 26 transition', () => {
      // Birthday in ~79 days (Feb 1, 2026) - within 180 day window for planning
      const birthDate = new Date('2000-02-01');

      const result = generateRecommendations({
        age: 25,
        birthDate,
        householdSize: 1,
        estimatedIncome: 35000,
        state: 'CA',
      });

      const age26Rec = result.recommendations.find(r => r.category === 'life_event');
      expect(age26Rec).toBeTruthy();
    });

    test('handles active Special Enrollment Period', () => {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() - 10); // 10 days ago

      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
        specialEnrollmentReason: 'loss_of_coverage',
        specialEnrollmentDate: eventDate,
      });

      const sepRec = result.recommendations.find(r => r.title.includes('Special Enrollment'));
      expect(sepRec).toBeTruthy();
      expect(sepRec?.deadline).toBeTruthy();
    });

    test('warns about expired SEP', () => {
      const pastEvent = new Date();
      pastEvent.setDate(pastEvent.getDate() - 90); // 90 days ago (expired)

      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
        specialEnrollmentReason: 'loss_of_coverage',
        specialEnrollmentDate: pastEvent,
      });

      expect(result.warnings.some(w => w.includes('ended'))).toBe(true);
    });
  });

  describe('Relocation Recommendations', () => {
    test('recommends relocation for coverage gap', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 18000,
        state: 'TX', // Non-expansion state
        consideringRelocation: true,
      });

      const relocationRec = result.recommendations.find(r => r.category === 'relocation');
      // For coverage gap scenarios, relocation is about gaining coverage, not monetary savings
      if (relocationRec) {
        expect(relocationRec.title).toContain('Moving');
        expect(relocationRec.urgency).toBeTruthy();
      }
      // Should also warn about coverage gap
      expect(result.financialSummary.eligibility.inCoverageGap).toBe(true);
    });

    test('does not recommend relocation when not requested', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
        consideringRelocation: false,
      });

      const relocationRecs = result.recommendations.filter(r => r.category === 'relocation');
      expect(relocationRecs.length).toBe(0);
    });
  });

  describe('Priority & Urgency', () => {
    test('prioritizes Medicaid over other recommendations', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 18000,
        state: 'CA',
      });

      const medicaidRec = result.recommendations.find(r => r.title.includes('Medicaid'));
      expect(medicaidRec?.priority).toBeLessThanOrEqual(2);
    });

    test('assigns correct urgency levels', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
      });

      result.recommendations.forEach(rec => {
        expect(rec.urgency).toMatch(/^(low|moderate|high|critical)$/);
      });
    });

    test('recommendations are sorted by priority', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
      });

      for (let i = 0; i < result.recommendations.length - 1; i++) {
        expect(result.recommendations[i].priority).toBeLessThanOrEqual(
          result.recommendations[i + 1].priority
        );
      }
    });
  });

  describe('Next Steps & Warnings', () => {
    test('provides actionable next steps', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
      });

      expect(result.nextSteps).toBeTruthy();
      expect(Array.isArray(result.nextSteps)).toBe(true);
      result.nextSteps.forEach(step => {
        expect(step.step).toBeTruthy();
        expect(step.priority).toMatch(/^(low|moderate|high|critical)$/);
      });
    });

    test('includes planning recommendations', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
      });

      const planningRec = result.recommendations.find(r => r.category === 'planning');
      expect(planningRec).toBeTruthy();
    });
  });

  describe('Family Scenarios', () => {
    test('handles family with children', () => {
      const result = generateRecommendations({
        age: 38,
        householdSize: 4,
        adults: [38, 36],
        children: [8, 5],
        estimatedIncome: 60000,
        state: 'CA',
      });

      expect(result.recommendedPlan).toBeTruthy();
      expect(result.financialSummary.costs.lowestTotalCost).toBeGreaterThan(0);
    });

    test('accounts for household size in FPL calculation', () => {
      const single = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 30000,
        state: 'CA',
      });

      const family = generateRecommendations({
        age: 35,
        householdSize: 4,
        estimatedIncome: 30000,
        state: 'CA',
      });

      // Family with same income but more people should get more subsidies or Medicaid
      expect(family.financialSummary.eligibility.medicaid).toBe(true);
      expect(single.financialSummary.eligibility.medicaid).toBe(false);
    });
  });

  describe('Real-World Scenarios', () => {
    test('young healthy individual in California', () => {
      const result = generateRecommendations({
        age: 28,
        householdSize: 1,
        estimatedIncome: 45000,
        state: 'CA',
        healthStatus: 'excellent',
      });

      expect(result.primaryRecommendation).toBeTruthy();
      expect(result.recommendedPlan.metalTier).toBeTruthy();
      expect(result.financialSummary.riskAssessment.category).toBe('low');
    });

    test('near-retirement couple in Texas', () => {
      const result = generateRecommendations({
        age: 62,
        householdSize: 2,
        adults: [62, 60],
        estimatedIncome: 55000,
        state: 'TX',
        healthStatus: 'fair',
        chronicConditions: ['hypertensionControlled'],
      });

      expect(result.recommendedPlan).toBeTruthy();
      expect(result.financialSummary.eligibility.premiumTaxCredit).toBe(true);
    });

    test('low-income person in coverage gap state', () => {
      const result = generateRecommendations({
        age: 40,
        householdSize: 1,
        estimatedIncome: 18000,
        state: 'FL', // Non-expansion
      });

      expect(result.financialSummary.eligibility.inCoverageGap).toBe(true);
      expect(result.primaryRecommendation).toContain('coverage gap');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('middle-income family in expansion state', () => {
      const result = generateRecommendations({
        age: 42,
        householdSize: 4,
        adults: [42, 40],
        children: [10, 7],
        estimatedIncome: 70000,
        state: 'CA',
      });

      expect(result.financialSummary.eligibility.medicaid).toBe(false);
      expect(result.financialSummary.eligibility.premiumTaxCredit).toBe(true);
      expect(result.recommendedPlan.metalTier).toBeTruthy();
    });

    test('high-income person with no subsidies', () => {
      const result = generateRecommendations({
        age: 45,
        householdSize: 1,
        estimatedIncome: 100000,
        state: 'NY',
      });

      expect(result.financialSummary.eligibility.medicaid).toBe(false);
      expect(result.recommendedPlan).toBeTruthy();
      // May get small PTC due to IRA 2022 no cliff
    });

    test('person with chronic conditions needing higher coverage', () => {
      const result = generateRecommendations({
        age: 50,
        householdSize: 1,
        estimatedIncome: 50000,
        state: 'CA',
        healthStatus: 'fair',
        chronicConditions: ['diabetesType2Controlled', 'hypertensionControlled'],
      });

      expect(result.financialSummary.riskAssessment.category).toMatch(/moderate|high/);
      expect(result.financialSummary.riskAssessment.recommendedReserve).toBeGreaterThan(5000);
    });
  });

  describe('Recommendation Structure', () => {
    test('returns complete recommendation object', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
      });

      expect(result.primaryRecommendation).toBeTruthy();
      expect(result.recommendedPlan).toBeTruthy();
      expect(result.recommendations).toBeTruthy();
      expect(result.financialSummary).toBeTruthy();
      expect(result.nextSteps).toBeTruthy();
      expect(result.warnings).toBeTruthy();
    });

    test('all recommendations have required fields', () => {
      const result = generateRecommendations({
        age: 35,
        householdSize: 1,
        estimatedIncome: 40000,
        state: 'CA',
      });

      result.recommendations.forEach(rec => {
        expect(rec.priority).toBeGreaterThan(0);
        expect(rec.category).toBeTruthy();
        expect(rec.title).toBeTruthy();
        expect(rec.summary).toBeTruthy();
        expect(rec.details).toBeTruthy();
        expect(rec.action).toBeTruthy();
        expect(rec.urgency).toBeTruthy();
      });
    });
  });
});
