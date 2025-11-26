/**
 * Medicare Transition Planner Tests
 */

import {
  analyzeMedicareTransition,
  getMedicareEligibilityDate,
  calculatePartBPenalty,
  calculatePartDPenalty,
  getIRMAASurcharge,
  type MedicareTransitionInput,
} from '../medicare-transition';

describe('Medicare Transition Planner', () => {
  // Helper to create a base input
  // Use a DOB that results in turning 65 about 6 months from now
  const getBaseDOB = () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 64, today.getMonth() + 6, 15);
    return dob;
  };

  const createBaseInput = (overrides: Partial<MedicareTransitionInput> = {}): MedicareTransitionInput => ({
    dateOfBirth: getBaseDOB(),
    currentMonthlyPremium: 600,
    hasEmployerCoverage: false,
    state: 'TX',
    wantsDrugCoverage: true,
    ...overrides,
  });

  describe('analyzeMedicareTransition', () => {
    it('should return comprehensive analysis', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      expect(analysis).toBeDefined();
      expect(analysis.timeline).toBeDefined();
      expect(analysis.costs).toBeDefined();
      expect(analysis.comparison).toBeDefined();
      expect(analysis.decisions).toBeDefined();
      expect(analysis.warnings).toBeDefined();
      expect(analysis.checklist).toBeDefined();
    });

    it('should calculate correct timeline dates', () => {
      // Use explicit date construction to avoid timezone issues
      const dob = new Date(1960, 5, 15); // June 15, 1960 (month is 0-indexed)
      const input = createBaseInput({
        dateOfBirth: dob,
      });
      const analysis = analyzeMedicareTransition(input);

      // 65th birthday should be June 15, 2025
      expect(analysis.timeline.birthday65.getFullYear()).toBe(2025);
      expect(analysis.timeline.birthday65.getMonth()).toBe(5); // June (0-indexed)

      // Medicare starts 1st of birthday month
      expect(analysis.timeline.medicareStartDate.getDate()).toBe(1);
      expect(analysis.timeline.medicareStartDate.getMonth()).toBe(5);
    });

    it('should include IEP enrollment period', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      const iep = analysis.timeline.enrollmentPeriods.find(p => p.type === 'IEP');
      expect(iep).toBeDefined();
      expect(iep!.name).toContain('Initial Enrollment');
      expect(iep!.applies).toBe(true);
    });

    it('should calculate Medicare costs', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.costs.partBPremium).toBeGreaterThan(0);
      expect(analysis.costs.totalMonthlyPremium).toBeGreaterThan(0);
    });

    it('should include Part A premium as $0 for most people', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.costs.partAPremium).toBe(0);
    });

    it('should compare costs with current coverage', () => {
      const input = createBaseInput({
        currentMonthlyPremium: 800,
      });
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.comparison.currentAnnualCost).toBe(9600); // 800 * 12
      expect(analysis.comparison.medicareAnnualCost).toBeGreaterThan(0);
      expect(typeof analysis.comparison.annualSavings).toBe('number');
      expect(analysis.comparison.recommendation).toMatch(/^(switch|delay|evaluate)$/);
    });

    it('should generate relevant decisions', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.decisions.length).toBeGreaterThan(0);
      expect(analysis.decisions.some(d => d.question.includes('Original Medicare'))).toBe(true);
    });

    it('should generate checklist items', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.checklist.length).toBeGreaterThan(0);
      expect(analysis.checklist.some(c => c.item.includes('Medicare number'))).toBe(true);
    });

    it('should include warnings', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.warnings.some(w => w.includes('Part D'))).toBe(true);
    });
  });

  describe('Employer Coverage Scenarios', () => {
    it('should recommend delay for large employer coverage', () => {
      const input = createBaseInput({
        hasEmployerCoverage: true,
        employerSize: 'large',
        stillWorking: true,
      });
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.comparison.recommendation).toBe('delay');
      expect(analysis.comparison.reasons.some(r => r.toLowerCase().includes('large employer'))).toBe(true);
    });

    it('should recommend switch for small employer coverage', () => {
      const input = createBaseInput({
        hasEmployerCoverage: true,
        employerSize: 'small',
        stillWorking: true,
      });
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.comparison.recommendation).toBe('switch');
      expect(analysis.comparison.reasons.some(r => r.toLowerCase().includes('small employer'))).toBe(true);
    });

    it('should include SEP for those with employer coverage', () => {
      const input = createBaseInput({
        hasEmployerCoverage: true,
        stillWorking: true,
      });
      const analysis = analyzeMedicareTransition(input);

      const sep = analysis.timeline.enrollmentPeriods.find(p => p.type === 'SEP');
      expect(sep).toBeDefined();
      expect(sep!.applies).toBe(true);
      expect(sep!.description).toContain('8 months');
    });

    it('should include decision about Part B timing for those with employer coverage', () => {
      const input = createBaseInput({
        hasEmployerCoverage: true,
        stillWorking: true,
        employerSize: 'large',
      });
      const analysis = analyzeMedicareTransition(input);

      const partBDecision = analysis.decisions.find(d => d.question.includes('Part B'));
      expect(partBDecision).toBeDefined();
      expect(partBDecision!.recommendation).toContain('stop working');
    });
  });

  describe('IRMAA Calculations', () => {
    it('should calculate IRMAA for high-income single filers', () => {
      const input = createBaseInput({
        magi: 150000,
        filingStatus: 'single',
      });
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.costs.partBIRMAA).toBeGreaterThan(0);
    });

    it('should have no IRMAA for income below threshold', () => {
      const input = createBaseInput({
        magi: 90000,
        filingStatus: 'single',
      });
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.costs.partBIRMAA).toBe(0);
      expect(analysis.costs.partDIRMAA).toBe(0);
    });

    it('should calculate IRMAA for married filing jointly', () => {
      const input = createBaseInput({
        magi: 250000,
        filingStatus: 'married_joint',
      });
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.costs.partBIRMAA).toBeGreaterThan(0);
    });

    it('should warn about IRMAA when applicable', () => {
      const input = createBaseInput({
        magi: 200000,
        filingStatus: 'single',
      });
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.warnings.some(w => w.includes('IRMAA'))).toBe(true);
    });
  });

  describe('VA/Tricare Coverage', () => {
    it('should provide guidance for VA/Tricare beneficiaries', () => {
      const input = createBaseInput({
        hasVAorTricare: true,
      });
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.comparison.reasons.some(r => r.includes('VA/Tricare'))).toBe(true);
    });
  });

  describe('getMedicareEligibilityDate', () => {
    it('should return 1st of birthday month at age 65', () => {
      const dob = new Date('1960-06-15');
      const eligibility = getMedicareEligibilityDate(dob);

      expect(eligibility.getFullYear()).toBe(2025);
      expect(eligibility.getMonth()).toBe(5); // June
      expect(eligibility.getDate()).toBe(1);
    });

    it('should handle birthday on 1st of month', () => {
      const dob = new Date(1960, 0, 1); // January 1, 1960
      const eligibility = getMedicareEligibilityDate(dob);

      expect(eligibility.getFullYear()).toBe(2025);
      expect(eligibility.getMonth()).toBe(0); // January
      expect(eligibility.getDate()).toBe(1);
    });

    it('should handle leap year birthday', () => {
      const dob = new Date('1960-02-29');
      const eligibility = getMedicareEligibilityDate(dob);

      expect(eligibility.getFullYear()).toBe(2025);
      expect(eligibility.getMonth()).toBe(1); // February
      expect(eligibility.getDate()).toBe(1);
    });
  });

  describe('calculatePartBPenalty', () => {
    it('should calculate 10% for 12-23 months delay', () => {
      const penalty = calculatePartBPenalty(12);
      expect(penalty).toBeCloseTo(17.47, 1); // 10% of standard premium
    });

    it('should calculate 20% for 24-35 months delay', () => {
      const penalty = calculatePartBPenalty(24);
      expect(penalty).toBeCloseTo(34.94, 1); // 20% of standard premium
    });

    it('should return 0 for less than 12 months delay', () => {
      const penalty = calculatePartBPenalty(6);
      expect(penalty).toBe(0);
    });

    it('should calculate 30% for 36-47 months delay', () => {
      const penalty = calculatePartBPenalty(36);
      expect(penalty).toBeCloseTo(52.41, 1); // 30% of standard premium
    });
  });

  describe('calculatePartDPenalty', () => {
    it('should calculate based on months delayed', () => {
      const penalty = calculatePartDPenalty(12);
      // 1% of base premium ($34.70) * 12 months
      expect(penalty).toBeCloseTo(4.16, 1);
    });

    it('should return 0 for 0 months delay', () => {
      const penalty = calculatePartDPenalty(0);
      expect(penalty).toBe(0);
    });

    it('should accumulate penalty for each month', () => {
      const penalty12 = calculatePartDPenalty(12);
      const penalty24 = calculatePartDPenalty(24);
      expect(penalty24).toBeCloseTo(penalty12 * 2, 1);
    });
  });

  describe('getIRMAASurcharge', () => {
    it('should return 0 for income below first threshold (single)', () => {
      const surcharge = getIRMAASurcharge(90000, 'single');
      expect(surcharge.partBExtra).toBe(0);
      expect(surcharge.partDExtra).toBe(0);
    });

    it('should return first tier surcharge (single)', () => {
      const surcharge = getIRMAASurcharge(120000, 'single');
      expect(surcharge.partBExtra).toBeGreaterThan(0);
      expect(surcharge.partDExtra).toBeGreaterThan(0);
    });

    it('should use higher thresholds for married filing jointly', () => {
      const singleSurcharge = getIRMAASurcharge(150000, 'single');
      const marriedSurcharge = getIRMAASurcharge(150000, 'married_joint');

      // $150k is above threshold for single but below for married joint
      expect(singleSurcharge.partBExtra).toBeGreaterThan(marriedSurcharge.partBExtra);
    });

    it('should handle married filing separately with higher surcharges', () => {
      const surcharge = getIRMAASurcharge(200000, 'married_separate');
      expect(surcharge.partBExtra).toBeGreaterThan(0);
    });
  });

  describe('Timeline Events', () => {
    it('should include key enrollment events', () => {
      // Create a DOB that results in turning 65 in the future
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setFullYear(today.getFullYear() - 64); // Will turn 65 in about 1 year
      futureDate.setMonth(today.getMonth() + 6);

      const input = createBaseInput({
        dateOfBirth: futureDate,
      });
      const analysis = analyzeMedicareTransition(input);

      // Should have events when 65th birthday is in the future
      expect(analysis.timeline.daysUntil65).toBeGreaterThan(0);
      const events = analysis.timeline.events.map(e => e.event);
      expect(events.some(e => e.includes('Initial Enrollment'))).toBe(true);
      expect(events.some(e => e.includes('Birthday'))).toBe(true);
    });

    it('should sort events chronologically', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      for (let i = 1; i < analysis.timeline.events.length; i++) {
        const current = analysis.timeline.events[i];
        const previous = analysis.timeline.events[i - 1];
        if (current && previous) {
          expect(current.date.getTime()).toBeGreaterThanOrEqual(previous.date.getTime());
        }
      }
    });

    it('should mark urgent events when close to 65', () => {
      // Create scenario close to turning 65
      const almostSixtyFive = new Date();
      almostSixtyFive.setFullYear(almostSixtyFive.getFullYear() - 65);
      almostSixtyFive.setMonth(almostSixtyFive.getMonth() + 2); // 2 months until 65

      const input = createBaseInput({
        dateOfBirth: almostSixtyFive,
      });
      const analysis = analyzeMedicareTransition(input);

      const urgentEvents = analysis.timeline.events.filter(e => e.urgent);
      expect(urgentEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Estimates', () => {
    it('should estimate Medigap premium', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.costs.medigapPremium).toBeGreaterThan(0);
    });

    it('should vary Medigap by state', () => {
      const inputTX = createBaseInput({ state: 'TX' });
      const inputNY = createBaseInput({ state: 'NY' });

      const analysisTX = analyzeMedicareTransition(inputTX);
      const analysisNY = analyzeMedicareTransition(inputNY);

      // NY should be more expensive
      expect(analysisNY.costs.medigapPremium).toBeGreaterThan(analysisTX.costs.medigapPremium);
    });

    it('should include Part D premium when drug coverage wanted', () => {
      const inputWithDrugs = createBaseInput({ wantsDrugCoverage: true });
      const inputNoDrugs = createBaseInput({ wantsDrugCoverage: false });

      const analysisWithDrugs = analyzeMedicareTransition(inputWithDrugs);
      const analysisNoDrugs = analyzeMedicareTransition(inputNoDrugs);

      expect(analysisWithDrugs.costs.partDPremium).toBeGreaterThan(0);
      expect(analysisNoDrugs.costs.partDPremium).toBe(0);
    });

    it('should estimate annual out-of-pocket costs', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      expect(analysis.costs.estimatedAnnualOOP).toBeGreaterThan(0);
    });
  });

  describe('Checklist Priority', () => {
    it('should include high priority items', () => {
      const input = createBaseInput();
      const analysis = analyzeMedicareTransition(input);

      const highPriority = analysis.checklist.filter(c => c.priority === 'high');
      expect(highPriority.length).toBeGreaterThan(0);
    });

    it('should mark creditable coverage letter as high priority for employer coverage', () => {
      const input = createBaseInput({
        hasEmployerCoverage: true,
      });
      const analysis = analyzeMedicareTransition(input);

      const creditableLetter = analysis.checklist.find(c => c.item.includes('creditable'));
      expect(creditableLetter).toBeDefined();
      expect(creditableLetter!.priority).toBe('high');
    });
  });
});
