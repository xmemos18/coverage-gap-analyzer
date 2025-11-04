import {
  calculateActuarialProbability,
  calculateHouseholdActuarialProbability,
  getAgeAdjustedCost,
} from '../calculator/actuarialCurves';

describe('Actuarial Probability Curves', () => {
  describe('Dental Insurance', () => {
    it('should show high probability for children (0-18)', () => {
      const child5 = calculateActuarialProbability(5, 'dental');
      const child12 = calculateActuarialProbability(12, 'dental');

      expect(child5.probabilityScore).toBeGreaterThanOrEqual(85);
      expect(child12.probabilityScore).toBeGreaterThanOrEqual(90);
      expect(child5.riskLevel).toBe('very-high');
    });

    it('should show moderate probability for young adults (19-50)', () => {
      const adult30 = calculateActuarialProbability(30, 'dental');

      expect(adult30.probabilityScore).toBeGreaterThanOrEqual(65);
      expect(adult30.probabilityScore).toBeLessThan(80);
      expect(adult30.riskLevel).toMatch(/moderate|high/);
    });

    it('should show high probability for seniors (65+)', () => {
      const senior70 = calculateActuarialProbability(70, 'dental');

      expect(senior70.probabilityScore).toBeGreaterThanOrEqual(85);
      expect(senior70.riskLevel).toMatch(/high|very-high/);
    });

    it('should have higher cost multiplier for seniors', () => {
      const adult30 = calculateActuarialProbability(30, 'dental');
      const senior70 = calculateActuarialProbability(70, 'dental');

      expect(senior70.costMultiplier).toBeGreaterThan(adult30.costMultiplier);
    });
  });

  describe('Vision Insurance', () => {
    it('should show lower probability for young adults (19-39)', () => {
      const adult25 = calculateActuarialProbability(25, 'vision');

      expect(adult25.probabilityScore).toBeLessThan(60);
    });

    it('should increase after age 40 (presbyopia)', () => {
      const adult35 = calculateActuarialProbability(35, 'vision');
      const adult45 = calculateActuarialProbability(45, 'vision');

      expect(adult45.probabilityScore).toBeGreaterThan(adult35.probabilityScore);
    });

    it('should show very high probability for seniors (65+)', () => {
      const senior75 = calculateActuarialProbability(75, 'vision');

      expect(senior75.probabilityScore).toBeGreaterThanOrEqual(85);
      expect(senior75.riskLevel).toBe('very-high');
    });
  });

  describe('Accident Insurance', () => {
    it('should peak for teens/young adults (16-25)', () => {
      const teen18 = calculateActuarialProbability(18, 'accident');
      const adult30 = calculateActuarialProbability(30, 'accident');

      expect(teen18.probabilityScore).toBeGreaterThanOrEqual(85);
      expect(teen18.probabilityScore).toBeGreaterThan(adult30.probabilityScore);
    });

    it('should be high for young children (0-10)', () => {
      const child5 = calculateActuarialProbability(5, 'accident');

      expect(child5.probabilityScore).toBeGreaterThanOrEqual(75);
    });

    it('should increase again for seniors (75+) due to falls', () => {
      const adult50 = calculateActuarialProbability(50, 'accident');
      const senior80 = calculateActuarialProbability(80, 'accident');

      expect(senior80.probabilityScore).toBeGreaterThan(adult50.probabilityScore);
    });
  });

  describe('Critical Illness Insurance', () => {
    it('should be very low for young adults (<30)', () => {
      const adult25 = calculateActuarialProbability(25, 'critical-illness');

      expect(adult25.probabilityScore).toBeLessThan(40);
      expect(adult25.riskLevel).toMatch(/very-low|low/);
    });

    it('should increase exponentially after age 40', () => {
      const adult35 = calculateActuarialProbability(35, 'critical-illness');
      const adult45 = calculateActuarialProbability(45, 'critical-illness');
      const adult55 = calculateActuarialProbability(55, 'critical-illness');

      expect(adult45.probabilityScore).toBeGreaterThan(adult35.probabilityScore);
      expect(adult55.probabilityScore).toBeGreaterThan(adult45.probabilityScore);
    });

    it('should peak for ages 50-75', () => {
      const adult60 = calculateActuarialProbability(60, 'critical-illness');

      expect(adult60.probabilityScore).toBeGreaterThanOrEqual(75);
      expect(adult60.riskLevel).toMatch(/high|very-high/);
    });

    it('should have much higher cost multiplier for older ages', () => {
      const adult35 = calculateActuarialProbability(35, 'critical-illness');
      const adult55 = calculateActuarialProbability(55, 'critical-illness');
      const adult65 = calculateActuarialProbability(65, 'critical-illness');

      expect(adult55.costMultiplier).toBeGreaterThan(adult35.costMultiplier);
      expect(adult65.costMultiplier).toBeGreaterThan(adult55.costMultiplier);
      expect(adult65.costMultiplier).toBeGreaterThanOrEqual(1.8);
    });
  });

  describe('Hospital Indemnity Insurance', () => {
    it('should be low for healthy young adults (19-49)', () => {
      const adult30 = calculateActuarialProbability(30, 'hospital-indemnity');

      expect(adult30.probabilityScore).toBeLessThan(50);
    });

    it('should increase significantly after age 65', () => {
      const adult55 = calculateActuarialProbability(55, 'hospital-indemnity');
      const senior75 = calculateActuarialProbability(75, 'hospital-indemnity');

      expect(senior75.probabilityScore).toBeGreaterThan(adult55.probabilityScore);
      expect(senior75.probabilityScore).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Disability Insurance (Income Protection)', () => {
    it('should be zero or very low before age 18 (no earned income)', () => {
      const child15 = calculateActuarialProbability(15, 'disability');

      expect(child15.probabilityScore).toBe(0);
    });

    it('should peak during working years (30-55)', () => {
      const adult25 = calculateActuarialProbability(25, 'disability');
      const adult45 = calculateActuarialProbability(45, 'disability');
      const adult60 = calculateActuarialProbability(60, 'disability');

      expect(adult45.probabilityScore).toBeGreaterThan(adult25.probabilityScore);
      expect(adult45.probabilityScore).toBeGreaterThan(adult60.probabilityScore);
      expect(adult45.probabilityScore).toBeGreaterThanOrEqual(75);
    });

    it('should be very low after retirement (65+)', () => {
      const senior70 = calculateActuarialProbability(70, 'disability');

      expect(senior70.probabilityScore).toBeLessThan(25);
    });

    it('should have higher cost multiplier for older workers', () => {
      const adult30 = calculateActuarialProbability(30, 'disability');
      const adult55 = calculateActuarialProbability(55, 'disability');

      expect(adult55.costMultiplier).toBeGreaterThan(adult30.costMultiplier);
    });
  });

  describe('Long-Term Care Insurance', () => {
    it('should be very low before age 40', () => {
      const adult30 = calculateActuarialProbability(30, 'long-term-care');

      expect(adult30.probabilityScore).toBeLessThan(30);
    });

    it('should show moderate probability at age 50-60 (sweet spot to buy)', () => {
      const adult55 = calculateActuarialProbability(55, 'long-term-care');

      expect(adult55.probabilityScore).toBeGreaterThanOrEqual(60);
      expect(adult55.probabilityScore).toBeLessThan(80);
    });

    it('should be very high for seniors (70+)', () => {
      const senior75 = calculateActuarialProbability(75, 'long-term-care');

      expect(senior75.probabilityScore).toBeGreaterThanOrEqual(80);
      expect(senior75.riskLevel).toBe('very-high');
    });

    it('should have exponentially higher costs with age', () => {
      const adult50 = calculateActuarialProbability(50, 'long-term-care');
      const adult60 = calculateActuarialProbability(60, 'long-term-care');
      const adult70 = calculateActuarialProbability(70, 'long-term-care');

      expect(adult60.costMultiplier).toBeGreaterThan(adult50.costMultiplier);
      expect(adult70.costMultiplier).toBeGreaterThan(adult60.costMultiplier);
      expect(adult70.costMultiplier).toBeGreaterThanOrEqual(2.5);
    });
  });

  describe('Term Life Insurance', () => {
    it('should be low for very young adults (<25)', () => {
      const adult22 = calculateActuarialProbability(22, 'life');

      expect(adult22.probabilityScore).toBeLessThan(65);
    });

    it('should peak during family years (30-50)', () => {
      const adult25 = calculateActuarialProbability(25, 'life');
      const adult40 = calculateActuarialProbability(40, 'life');
      const adult60 = calculateActuarialProbability(60, 'life');

      expect(adult40.probabilityScore).toBeGreaterThan(adult25.probabilityScore);
      expect(adult40.probabilityScore).toBeGreaterThan(adult60.probabilityScore);
      expect(adult40.probabilityScore).toBeGreaterThanOrEqual(75);
    });

    it('should decrease after retirement age (65+)', () => {
      const adult55 = calculateActuarialProbability(55, 'life');
      const senior70 = calculateActuarialProbability(70, 'life');

      expect(senior70.probabilityScore).toBeLessThan(adult55.probabilityScore);
    });

    it('should have much higher cost multiplier for older ages', () => {
      const adult30 = calculateActuarialProbability(30, 'life');
      const adult50 = calculateActuarialProbability(50, 'life');
      const adult65 = calculateActuarialProbability(65, 'life');

      expect(adult50.costMultiplier).toBeGreaterThan(adult30.costMultiplier);
      expect(adult65.costMultiplier).toBeGreaterThan(adult50.costMultiplier);
      expect(adult65.costMultiplier).toBeGreaterThanOrEqual(2.0);
    });
  });

  describe('Household Actuarial Probability', () => {
    it('should return maximum probability across household ages', () => {
      // Family with children and adults
      const familyAges = [35, 37, 8, 10];

      const dental = calculateHouseholdActuarialProbability(familyAges, 'dental');

      // Children have highest dental probability
      const child8 = calculateActuarialProbability(8, 'dental');
      expect(dental.probabilityScore).toBeGreaterThanOrEqual(child8.probabilityScore - 5);
    });

    it('should handle multi-generational households', () => {
      const ages = [28, 55, 75]; // Young adult, middle-aged, senior

      const ltc = calculateHouseholdActuarialProbability(ages, 'long-term-care');

      // Senior has highest LTC probability
      const senior75 = calculateActuarialProbability(75, 'long-term-care');
      expect(ltc.probabilityScore).toBeGreaterThanOrEqual(senior75.probabilityScore - 5);
    });

    it('should handle single-person household', () => {
      const ages = [45];

      const disability = calculateHouseholdActuarialProbability(ages, 'disability');

      expect(disability.probabilityScore).toBeGreaterThan(0);
      expect(disability.probabilityScore).toBeLessThanOrEqual(100);
    });

    it('should handle empty array with default age', () => {
      const ages: number[] = [];

      const dental = calculateHouseholdActuarialProbability(ages, 'dental');

      // Should default to age 35
      expect(dental.probabilityScore).toBeGreaterThan(0);
    });
  });

  describe('Age-Adjusted Cost Calculations', () => {
    it('should apply age multipliers to base cost', () => {
      const baseCost = 100;

      const young = getAgeAdjustedCost(baseCost, 25, 'critical-illness');
      const middle = getAgeAdjustedCost(baseCost, 50, 'critical-illness');
      const senior = getAgeAdjustedCost(baseCost, 65, 'critical-illness');

      expect(middle).toBeGreaterThan(young);
      expect(senior).toBeGreaterThan(middle);
    });

    it('should apply different multipliers for different insurance types', () => {
      const baseCost = 100;
      const age = 55;

      const dental = getAgeAdjustedCost(baseCost, age, 'dental');
      const ltc = getAgeAdjustedCost(baseCost, age, 'long-term-care');
      const accident = getAgeAdjustedCost(baseCost, age, 'accident');

      // LTC should have higher multiplier at 55 than dental
      expect(ltc).not.toBe(dental);
      expect(ltc).not.toBe(accident);
    });

    it('should handle edge ages (0 and 120)', () => {
      const baseCost = 100;

      const infant = getAgeAdjustedCost(baseCost, 0, 'dental');
      const elderly = getAgeAdjustedCost(baseCost, 120, 'hospital-indemnity');

      expect(infant).toBeGreaterThan(0);
      expect(elderly).toBeGreaterThan(0);
    });
  });

  describe('Risk Level Classifications', () => {
    it('should classify very-high risk correctly', () => {
      const senior80Dental = calculateActuarialProbability(80, 'dental');
      const senior85Hospital = calculateActuarialProbability(85, 'hospital-indemnity');

      expect(senior80Dental.riskLevel).toMatch(/very-high|high/);
      expect(senior85Hospital.riskLevel).toBe('very-high');
    });

    it('should classify low risk correctly', () => {
      const adult25LTC = calculateActuarialProbability(25, 'long-term-care');
      const adult30Critical = calculateActuarialProbability(30, 'critical-illness');

      expect(adult25LTC.riskLevel).toMatch(/very-low|low/);
      expect(adult30Critical.riskLevel).toMatch(/very-low|low|moderate/);
    });

    it('should classify moderate risk correctly', () => {
      const adult35Hospital = calculateActuarialProbability(35, 'hospital-indemnity');

      expect(adult35Hospital.riskLevel).toMatch(/low|moderate/);
    });
  });

  describe('Actuarial Reasoning', () => {
    it('should provide specific reasoning for each age/type combination', () => {
      const child8Dental = calculateActuarialProbability(8, 'dental');
      const adult45Disability = calculateActuarialProbability(45, 'disability');
      const senior70LTC = calculateActuarialProbability(70, 'long-term-care');

      expect(child8Dental.reasoning).toBeTruthy();
      expect(child8Dental.reasoning.length).toBeGreaterThan(20);

      expect(adult45Disability.reasoning).toBeTruthy();
      expect(adult45Disability.reasoning).toContain('income');

      expect(senior70LTC.reasoning).toBeTruthy();
      expect(senior70LTC.reasoning.length).toBeGreaterThan(20);
    });

    it('should mention key risk factors in reasoning', () => {
      const teen18Accident = calculateActuarialProbability(18, 'accident');
      const adult55Critical = calculateActuarialProbability(55, 'critical-illness');

      expect(teen18Accident.reasoning.toLowerCase()).toMatch(/driving|risk|behavior/);
      expect(adult55Critical.reasoning.toLowerCase()).toMatch(/cancer|heart|stroke|disease/);
    });
  });

  describe('Utilization Rates', () => {
    it('should provide realistic utilization rates', () => {
      const adult45Dental = calculateActuarialProbability(45, 'dental');
      const adult45Critical = calculateActuarialProbability(45, 'critical-illness');

      // Dental should have higher utilization than critical illness
      expect(adult45Dental.utilizationRate).toBeGreaterThan(adult45Critical.utilizationRate);

      // Rates should be reasonable (0-1)
      expect(adult45Dental.utilizationRate).toBeGreaterThan(0);
      expect(adult45Dental.utilizationRate).toBeLessThanOrEqual(1);
    });

    it('should show higher utilization for high-risk groups', () => {
      const adult30Hospital = calculateActuarialProbability(30, 'hospital-indemnity');
      const senior80Hospital = calculateActuarialProbability(80, 'hospital-indemnity');

      expect(senior80Hospital.utilizationRate).toBeGreaterThan(adult30Hospital.utilizationRate);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle age 0', () => {
      const infant = calculateActuarialProbability(0, 'dental');

      expect(infant.probabilityScore).toBeGreaterThan(0);
      expect(infant.probabilityScore).toBeLessThanOrEqual(100);
    });

    it('should handle age 120', () => {
      const elderly = calculateActuarialProbability(120, 'hospital-indemnity');

      expect(elderly.probabilityScore).toBeGreaterThan(0);
      expect(elderly.probabilityScore).toBeLessThanOrEqual(100);
    });

    it('should handle ages above 120 by clamping', () => {
      const result = calculateActuarialProbability(150, 'dental');

      expect(result.probabilityScore).toBeGreaterThan(0);
      expect(result.probabilityScore).toBeLessThanOrEqual(100);
    });

    it('should handle negative ages by clamping to 0', () => {
      const result = calculateActuarialProbability(-5, 'vision');

      expect(result.probabilityScore).toBeGreaterThan(0);
      expect(result.probabilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Actuarial Patterns', () => {
    it('should show smooth probability transitions across ages', () => {
      // Check that probabilities don't jump drastically between adjacent ages
      for (let age = 20; age < 70; age += 5) {
        const current = calculateActuarialProbability(age, 'critical-illness');
        const next = calculateActuarialProbability(age + 5, 'critical-illness');

        // Probability should not jump more than 30 points in 5 years
        const diff = Math.abs(next.probabilityScore - current.probabilityScore);
        expect(diff).toBeLessThan(30);
      }
    });

    it('should show exponential growth patterns for age-related conditions', () => {
      const ltc40 = calculateActuarialProbability(40, 'long-term-care');
      const ltc50 = calculateActuarialProbability(50, 'long-term-care');
      const ltc60 = calculateActuarialProbability(60, 'long-term-care');
      const ltc70 = calculateActuarialProbability(70, 'long-term-care');

      // Should show increasing probability with age
      expect(ltc50.probabilityScore).toBeGreaterThan(ltc40.probabilityScore);
      expect(ltc60.probabilityScore).toBeGreaterThanOrEqual(ltc50.probabilityScore); // May plateau in sweet spot
      expect(ltc70.probabilityScore).toBeGreaterThan(ltc60.probabilityScore);

      // Overall growth should be substantial
      const totalGrowth = ltc70.probabilityScore - ltc40.probabilityScore;
      expect(totalGrowth).toBeGreaterThan(40); // At least 40 point increase over 30 years
    });
  });
});
