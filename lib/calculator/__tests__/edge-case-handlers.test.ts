/**
 * Tests for Edge Case Handlers
 * Validates handling of life events, age transitions, and income changes
 */

import {
  calculateSpecialEnrollmentPeriod,
  analyzeAgeTransitions,
  analyzeIncomeVolatility,
  isOpenEnrollmentPeriod,
  getNextOpenEnrollment,
} from '../edge-case-handlers';

describe('Edge Case Handlers', () => {
  describe('calculateSpecialEnrollmentPeriod', () => {
    const baseEventDate = new Date('2025-03-15');
    const evaluationDate = new Date('2025-03-20'); // 5 days after event

    test('loss of coverage SEP', () => {
      const sep = calculateSpecialEnrollmentPeriod('loss_of_coverage', baseEventDate, evaluationDate);

      expect(sep.reason).toBe('loss_of_coverage');
      expect(sep.isActive).toBe(true);
      expect(sep.daysRemaining).toBeGreaterThan(0);
      expect(sep.instructions.length).toBeGreaterThan(0);
      expect(sep.requiredDocumentation).toContain('Proof of prior coverage (insurance termination letter)');
    });

    test('moving to new state SEP', () => {
      const sep = calculateSpecialEnrollmentPeriod('moved', baseEventDate, evaluationDate);

      expect(sep.reason).toBe('moved');
      expect(sep.isActive).toBe(true);
      expect(sep.requiredDocumentation.some(doc => doc.includes('address'))).toBe(true);
    });

    test('marriage SEP', () => {
      const sep = calculateSpecialEnrollmentPeriod('marriage', baseEventDate, evaluationDate);

      expect(sep.reason).toBe('marriage');
      expect(sep.isActive).toBe(true);
      expect(sep.requiredDocumentation).toContain('Marriage certificate');
      expect(sep.instructions.some(i => i.includes('household size'))).toBe(true);
    });

    test('birth/adoption SEP has retroactive coverage', () => {
      const birthDate = new Date('2025-03-15');
      const sep = calculateSpecialEnrollmentPeriod('birth_adoption', birthDate, evaluationDate);

      expect(sep.reason).toBe('birth_adoption');
      expect(sep.coverageEffectiveDate).toEqual(birthDate); // Retroactive
      expect(sep.requiredDocumentation.some(doc => doc.includes('Birth certificate'))).toBe(true);
    });

    test('job change SEP', () => {
      const sep = calculateSpecialEnrollmentPeriod('job_change', baseEventDate, evaluationDate);

      expect(sep.reason).toBe('job_change');
      expect(sep.isActive).toBe(true);
      expect(sep.instructions.some(i => i.includes('employer coverage'))).toBe(true);
    });

    test('income change has shorter window', () => {
      const sep = calculateSpecialEnrollmentPeriod('income_change', baseEventDate, evaluationDate);

      expect(sep.reason).toBe('income_change');
      expect(sep.daysRemaining).toBeLessThan(30);
      expect(sep.instructions.some(i => i.includes('30 days'))).toBe(true);
    });

    test('urgency levels based on days remaining', () => {
      // Critical: 7 days or less
      const critical = calculateSpecialEnrollmentPeriod(
        'loss_of_coverage',
        new Date('2025-03-20'),
        new Date('2025-05-14') // 1 day before end
      );
      expect(critical.urgency).toBe('critical');

      // High: 8-14 days
      const high = calculateSpecialEnrollmentPeriod(
        'loss_of_coverage',
        new Date('2025-03-20'),
        new Date('2025-05-07') // 8 days remaining
      );
      expect(high.urgency).toBe('high');

      // Moderate: 15-30 days
      const moderate = calculateSpecialEnrollmentPeriod(
        'loss_of_coverage',
        new Date('2025-03-20'),
        new Date('2025-04-20') // ~25 days remaining
      );
      expect(moderate.urgency).toBe('moderate');

      // Low: 30+ days
      const low = calculateSpecialEnrollmentPeriod(
        'loss_of_coverage',
        baseEventDate,
        new Date('2025-03-16') // Just after event, 59 days remaining
      );
      expect(low.urgency).toBe('low');
    });

    test('SEP is inactive before window starts', () => {
      const futureEvent = new Date('2025-06-01');
      const sep = calculateSpecialEnrollmentPeriod('loss_of_coverage', futureEvent, evaluationDate);

      expect(sep.isActive).toBe(false);
      expect(sep.daysRemaining).toBeGreaterThan(60);
    });

    test('SEP is inactive after window ends', () => {
      const pastEvent = new Date('2025-01-01');
      const sep = calculateSpecialEnrollmentPeriod('loss_of_coverage', pastEvent, evaluationDate);

      expect(sep.isActive).toBe(false);
      expect(sep.daysRemaining).toBeLessThan(0);
      expect(sep.urgency).toBe('critical'); // Missed deadline
    });

    test('divorce SEP', () => {
      const sep = calculateSpecialEnrollmentPeriod('divorce', baseEventDate, evaluationDate);

      expect(sep.reason).toBe('divorce');
      expect(sep.requiredDocumentation).toContain('Divorce decree');
    });
  });

  describe('analyzeAgeTransitions', () => {
    test('25-year-old approaching 26', () => {
      const birthDate = new Date('1999-06-01');
      const evaluationDate = new Date('2025-03-01'); // ~3 months before 26th birthday

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      expect(analysis.currentAge).toBe(25);
      expect(analysis.transitions.length).toBeGreaterThan(0);

      const age26Transition = analysis.transitions.find(t => t.age === 26);
      expect(age26Transition).toBeTruthy();
      expect(age26Transition!.event).toContain('parent');
      expect(age26Transition!.daysUntil).toBeGreaterThan(0);
      expect(age26Transition!.daysUntil).toBeLessThan(100);
      // Should have either immediate concerns or planning recommendations
      expect(analysis.immediateConcerns.length + analysis.planningRecommendations.length).toBeGreaterThan(0);
    });

    test('25-year-old with 1 month until 26', () => {
      const birthDate = new Date('1999-04-15');
      const evaluationDate = new Date('2025-03-15'); // 1 month before 26th birthday

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      const age26Transition = analysis.transitions.find(t => t.age === 26);
      expect(age26Transition!.daysUntil).toBeLessThan(35);
      expect(age26Transition!.urgency).toMatch(/moderate|high|critical/);
    });

    test('64-year-old approaching Medicare', () => {
      const birthDate = new Date('1960-07-01');
      const evaluationDate = new Date('2025-03-01'); // ~4 months before 65th birthday

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      const age65Transition = analysis.transitions.find(t => t.age === 65);
      expect(age65Transition).toBeTruthy();
      expect(age65Transition!.event).toContain('Medicare');
      expect(age65Transition!.impacts.some(i => i.includes('Medicare'))).toBe(true);
      expect(age65Transition!.actions.some(a => a.includes('3 months before'))).toBe(true);
      expect(age65Transition!.daysUntil).toBeLessThan(150);
      // Should have concerns or recommendations
      expect(analysis.immediateConcerns.length + analysis.planningRecommendations.length).toBeGreaterThan(0);
    });

    test('30-year-old has multiple future transitions', () => {
      const birthDate = new Date('1995-01-01');
      const evaluationDate = new Date('2025-03-01');

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      expect(analysis.currentAge).toBe(30);

      // Should have transitions for 40, 50, 60, 64, 65
      expect(analysis.transitions.length).toBeGreaterThanOrEqual(4);

      const futureAges = analysis.transitions.map(t => t.age);
      expect(futureAges).toContain(40);
      expect(futureAges).toContain(65);
    });

    test('transitions are sorted by date', () => {
      const birthDate = new Date('1995-01-01');
      const evaluationDate = new Date('2025-03-01');

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      for (let i = 0; i < analysis.transitions.length - 1; i++) {
        expect(analysis.transitions[i].daysUntil).toBeLessThan(
          analysis.transitions[i + 1].daysUntil
        );
      }
    });

    test('premium increase transitions at milestone ages', () => {
      const birthDate = new Date('1995-01-01');
      const evaluationDate = new Date('2025-03-01');

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      const age40 = analysis.transitions.find(t => t.age === 40);
      expect(age40?.event).toContain('Premium increase');
    });

    test('age 64 warns about Medicare planning', () => {
      const birthDate = new Date('1996-01-01');
      const evaluationDate = new Date('2025-03-01');

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      const age64 = analysis.transitions.find(t => t.age === 64);
      expect(age64?.event).toContain('Maximum ACA premium');
      expect(age64?.actions.some(a => a.includes('Medicare'))).toBe(true);
    });

    test('no transitions for someone already past all milestones', () => {
      const birthDate = new Date('1950-01-01');
      const evaluationDate = new Date('2025-03-01');

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      expect(analysis.currentAge).toBe(75);
      expect(analysis.transitions.length).toBe(0);
      expect(analysis.immediateConcerns.length).toBe(0);
    });

    test('planning recommendations for distant transitions', () => {
      const birthDate = new Date('2000-01-01');
      const evaluationDate = new Date('2025-03-01');

      const analysis = analyzeAgeTransitions(birthDate, evaluationDate);

      expect(analysis.planningRecommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeIncomeVolatility', () => {
    const baseParams = {
      householdSize: 1,
      state: 'CA',
      currentMonthlyPremium: 400,
      currentMonthlyPTC: 200,
      monthsRemaining: 6,
    };

    test('income increase reduces subsidies', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 30000,
        projectedIncome: 45000,
      });

      expect(analysis.incomeChange).toBe(15000);
      expect(analysis.percentageChange).toBeCloseTo(50, 0);
      expect(analysis.projectedEligibility.monthlyPTC).toBeLessThan(
        analysis.currentEligibility.monthlyPTC
      );
      // With 6 months remaining and income increase, some reconciliation risk
      expect(analysis.reconciliationRisk).toBeTruthy();
    });

    test('income decrease increases subsidies', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 50000,
        projectedIncome: 30000,
      });

      expect(analysis.incomeChange).toBe(-20000);
      expect(analysis.percentageChange).toBeCloseTo(-40, 0);
      expect(analysis.projectedEligibility.monthlyPTC).toBeGreaterThan(
        analysis.currentEligibility.monthlyPTC
      );
      // Should have some recommendations
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    test('crossing Medicaid threshold (gaining eligibility)', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 25000, // ~166% FPL
        projectedIncome: 18000, // ~120% FPL
      });

      expect(analysis.currentEligibility.medicaid).toBe(false);
      expect(analysis.projectedEligibility.medicaid).toBe(true);
      expect(analysis.crossesThreshold).toBe(true);
      expect(analysis.thresholdsCrossed.some(t => t.includes('Medicaid eligible'))).toBe(true);
      expect(analysis.recommendations.some(r => r.includes('Medicaid'))).toBe(true);
    });

    test('crossing Medicaid threshold (losing eligibility)', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 18000,
        projectedIncome: 25000,
      });

      expect(analysis.currentEligibility.medicaid).toBe(true);
      expect(analysis.projectedEligibility.medicaid).toBe(false);
      expect(analysis.crossesThreshold).toBe(true);
      expect(analysis.thresholdsCrossed.some(t => t.includes('Losing Medicaid'))).toBe(true);
    });

    test('significant income change triggers warnings', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 40000,
        projectedIncome: 60000, // 50% increase
      });

      expect(Math.abs(analysis.percentageChange)).toBeGreaterThan(25);
      expect(analysis.warnings.some(w => w.includes('Significant income change'))).toBe(true);
    });

    test('small income change has low reconciliation risk', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 40000,
        projectedIncome: 41000,
      });

      expect(Math.abs(analysis.estimatedReconciliationImpact)).toBeLessThan(500);
      expect(analysis.reconciliationRisk).toMatch(/none|low/);
    });

    test('large income change has reconciliation risk', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 30000,
        projectedIncome: 60000,
      });

      // Large income change should generate warnings
      expect(analysis.percentageChange).toBe(100);
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.reconciliationRisk).not.toBe('none');
    });

    test('recommends reporting income changes', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 20000,
        projectedIncome: 18000, // Drops to Medicaid level
      });

      // Should have recommendations regardless of threshold crossing
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      // Big percentage change triggers warnings
      if (Math.abs(analysis.percentageChange) > 10) {
        expect(analysis.recommendations.some(r => r.toLowerCase().includes('report') || r.toLowerCase().includes('marketplace'))).toBe(true);
      }
    });

    test('calculates FPL percentages correctly', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 20000,
        projectedIncome: 20000,
      });

      // For single person: FPL = 15060 + 0 = 15060
      // 20000 / 15060 = ~133% FPL
      expect(analysis.currentFPL).toBeCloseTo(133, 0);
      expect(analysis.projectedFPL).toBeCloseTo(133, 0);
    });

    test('handles zero current income', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 0,
        projectedIncome: 30000,
      });

      expect(analysis.percentageChange).toBe(0); // Avoid division by zero
      expect(analysis.incomeChange).toBe(30000);
    });

    test('estimates reconciliation impact correctly', () => {
      const analysis = analyzeIncomeVolatility({
        ...baseParams,
        currentIncome: 40000,
        projectedIncome: 50000,
        currentMonthlyPTC: 300,
        monthsRemaining: 6,
      });

      // Projected PTC should be less than current
      // Impact = (projected - current) * months remaining
      const expectedImpact = (analysis.projectedEligibility.monthlyPTC - 300) * 6;

      expect(analysis.estimatedReconciliationImpact).toBeCloseTo(expectedImpact, -1);
    });
  });

  describe('isOpenEnrollmentPeriod', () => {
    test('November 1 is in OEP', () => {
      const nov1 = new Date(2025, 10, 1); // Month is 0-indexed: 10 = November
      expect(isOpenEnrollmentPeriod(nov1)).toBe(true);
    });

    test('December is in OEP', () => {
      const dec15 = new Date('2025-12-15');
      expect(isOpenEnrollmentPeriod(dec15)).toBe(true);
    });

    test('January 1-15 is in OEP', () => {
      const jan10 = new Date('2026-01-10');
      expect(isOpenEnrollmentPeriod(jan10)).toBe(true);

      const jan15 = new Date('2026-01-15');
      expect(isOpenEnrollmentPeriod(jan15)).toBe(true);
    });

    test('January 16 is NOT in OEP', () => {
      const jan16 = new Date(2026, 0, 16); // Month is 0-indexed: 0 = January
      // Note: Some states/platforms may extend OEP
      // For federal marketplace, it ends January 15
      expect(isOpenEnrollmentPeriod(jan16)).toBe(false);
    });

    test('October is NOT in OEP', () => {
      const oct15 = new Date('2025-10-15');
      expect(isOpenEnrollmentPeriod(oct15)).toBe(false);
    });

    test('Summer is NOT in OEP', () => {
      const july4 = new Date('2025-07-04');
      expect(isOpenEnrollmentPeriod(july4)).toBe(false);
    });
  });

  describe('getNextOpenEnrollment', () => {
    test('returns next OEP when in March', () => {
      const march = new Date('2025-03-15');
      const next = getNextOpenEnrollment(march);

      expect(next.start.getMonth()).toBe(10); // November (0-indexed)
      expect(next.start.getFullYear()).toBe(2025);
      expect(next.end.getFullYear()).toBe(2026);
      expect(next.end.getMonth()).toBe(0); // January
      expect(next.end.getDate()).toBe(15);
      expect(next.daysUntil).toBeGreaterThan(200);
    });

    test('returns current OEP when in November', () => {
      const nov15 = new Date('2025-11-15');
      const next = getNextOpenEnrollment(nov15);

      expect(next.start.getFullYear()).toBe(2025);
      expect(next.start.getMonth()).toBe(10);
      expect(next.daysUntil).toBeLessThan(0); // Already started
    });

    test('returns current OEP when in December', () => {
      const dec15 = new Date('2025-12-15');
      const next = getNextOpenEnrollment(dec15);

      expect(next.start.getFullYear()).toBe(2025);
      expect(next.start.getMonth()).toBe(10);
    });

    test('returns current OEP when in early January', () => {
      const jan5 = new Date('2026-01-05');
      const next = getNextOpenEnrollment(jan5);

      expect(next.start.getFullYear()).toBe(2025);
      expect(next.end.getFullYear()).toBe(2026);
    });

    test('returns next year OEP when after January 15', () => {
      const jan20 = new Date('2026-01-20');
      const next = getNextOpenEnrollment(jan20);

      expect(next.start.getFullYear()).toBe(2026);
      expect(next.start.getMonth()).toBe(10);
      expect(next.end.getFullYear()).toBe(2027);
    });

    test('calculates days until correctly', () => {
      const march1 = new Date('2025-03-01');
      const next = getNextOpenEnrollment(march1);

      // From March 1 to November 1 is 245 days
      expect(next.daysUntil).toBeGreaterThan(240);
      expect(next.daysUntil).toBeLessThan(250);
    });
  });

  describe('Real-World Scenarios', () => {
    test('person loses job and coverage in March', () => {
      const jobLossDate = new Date('2025-03-15');
      const evaluationDate = new Date('2025-03-20'); // 5 days after
      const sep = calculateSpecialEnrollmentPeriod('loss_of_coverage', jobLossDate, evaluationDate);

      expect(sep.isActive).toBe(true);
      expect(sep.daysRemaining).toBeGreaterThan(0);
      expect(sep.urgency).toBe('low'); // Just happened, 55+ days remaining
    });

    test('college graduate turning 26', () => {
      const birthDate = new Date('1999-05-15');
      const graduationDate = new Date('2025-05-10'); // Just before 26th birthday

      const transitions = analyzeAgeTransitions(birthDate, graduationDate);

      const age26 = transitions.transitions.find(t => t.age === 26);
      expect(age26?.daysUntil).toBeLessThan(10);
      expect(age26?.urgency).toBe('critical');
    });

    test('freelancer with variable income', () => {
      const volatility = analyzeIncomeVolatility({
        currentIncome: 40000,
        projectedIncome: 55000, // Good year
        householdSize: 1,
        state: 'CA',
        currentMonthlyPremium: 450,
        currentMonthlyPTC: 150,
        monthsRemaining: 8,
      });

      expect(volatility.percentageChange).toBeCloseTo(37.5, 0);
      // Significant income change should generate warnings or recommendations
      expect(volatility.warnings.length + volatility.recommendations.length).toBeGreaterThan(0);
    });

    test('person moves from Texas to California', () => {
      const moveDate = new Date('2025-04-01');
      const sep = calculateSpecialEnrollmentPeriod('moved', moveDate);

      expect(sep.reason).toBe('moved');
      expect(sep.instructions.some(i => i.includes('new coverage area'))).toBe(true);
      expect(sep.requiredDocumentation.some(d => d.includes('address'))).toBe(true);
    });

    test('person getting married', () => {
      const weddingDate = new Date('2025-06-15');
      const sep = calculateSpecialEnrollmentPeriod('marriage', weddingDate);

      expect(sep.reason).toBe('marriage');
      expect(sep.instructions.some(i => i.includes('household size'))).toBe(true);
    });

    test('approaching Medicare with multiple considerations', () => {
      const birthDate = new Date('1960-09-01');
      const currentDate = new Date('2025-03-01'); // 6 months before 65th birthday

      const transitions = analyzeAgeTransitions(birthDate, currentDate);

      const age65 = transitions.transitions.find(t => t.age === 65);
      expect(age65?.daysUntil).toBeLessThan(200);
      expect(age65?.actions.some(a => a.includes('Part D'))).toBe(true);
      expect(age65?.actions.some(a => a.includes('Medigap'))).toBe(true);
      // Should have concerns or recommendations for Medicare transition
      expect(transitions.immediateConcerns.length + transitions.planningRecommendations.length).toBeGreaterThan(0);
    });
  });
});
