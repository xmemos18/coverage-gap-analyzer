import { getInsuranceTerm, hasDefinition, getAllTerms } from '../insurance-terms';

describe('Insurance Terms Dictionary', () => {
  describe('getInsuranceTerm', () => {
    it('should return term data for Medicare', () => {
      const term = getInsuranceTerm('Medicare');

      expect(term).toBeDefined();
      expect(term?.term).toBe('Medicare');
      expect(term?.definition).toContain('Federal health insurance program');
      expect(term?.example).toBeDefined();
    });

    it('should return term data for PPO', () => {
      const term = getInsuranceTerm('PPO');

      expect(term).toBeDefined();
      expect(term?.term).toBe('PPO (Preferred Provider Organization)');
      expect(term?.definition).toContain('flexibility');
    });

    it('should return term data for Deductible', () => {
      const term = getInsuranceTerm('Deductible');

      expect(term).toBeDefined();
      expect(term?.term).toBe('Deductible');
      expect(term?.definition).toContain('out-of-pocket');
    });

    it('should return undefined for unknown term', () => {
      const term = getInsuranceTerm('NonExistentTerm');

      expect(term).toBeUndefined();
    });
  });

  describe('hasDefinition', () => {
    it('should return true for known terms', () => {
      expect(hasDefinition('Medicare')).toBe(true);
      expect(hasDefinition('PPO')).toBe(true);
      expect(hasDefinition('HMO')).toBe(true);
      expect(hasDefinition('Deductible')).toBe(true);
      expect(hasDefinition('Premium')).toBe(true);
    });

    it('should return false for unknown terms', () => {
      expect(hasDefinition('UnknownTerm')).toBe(false);
      expect(hasDefinition('RandomWord')).toBe(false);
    });
  });

  describe('getAllTerms', () => {
    it('should return an array of terms', () => {
      const terms = getAllTerms();

      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
    });

    it('should include common insurance terms', () => {
      const terms = getAllTerms();

      expect(terms).toContain('Medicare');
      expect(terms).toContain('PPO');
      expect(terms).toContain('HMO');
      expect(terms).toContain('Deductible');
      expect(terms).toContain('Premium');
      expect(terms).toContain('Copay');
      expect(terms).toContain('Coinsurance');
    });

    it('should include Medicare-specific terms', () => {
      const terms = getAllTerms();

      expect(terms).toContain('Medicare Advantage');
      expect(terms).toContain('Medigap');
      expect(terms).toContain('Medicare Part A');
      expect(terms).toContain('Medicare Part B');
      expect(terms).toContain('Medicare Part D');
    });
  });

  describe('Term Coverage', () => {
    it('should have definitions for all plan types', () => {
      const planTypes = ['Medicare', 'Medicare Advantage', 'Medigap', 'PPO', 'HMO', 'EPO', 'ACA', 'HDHP'];

      planTypes.forEach(planType => {
        expect(hasDefinition(planType)).toBe(true);
      });
    });

    it('should have definitions for common cost terms', () => {
      const costTerms = ['Premium', 'Deductible', 'Copay', 'Coinsurance', 'Out-of-Pocket Maximum'];

      costTerms.forEach(term => {
        expect(hasDefinition(term)).toBe(true);
      });
    });

    it('should have definitions for network terms', () => {
      const networkTerms = ['In-Network', 'Out-of-Network', 'Network'];

      networkTerms.forEach(term => {
        expect(hasDefinition(term)).toBe(true);
      });
    });
  });

  describe('Term Quality', () => {
    it('should have non-empty definitions for all terms', () => {
      const terms = getAllTerms();

      terms.forEach(termKey => {
        const term = getInsuranceTerm(termKey);
        expect(term?.definition).toBeTruthy();
        expect(term?.definition.length).toBeGreaterThan(10);
      });
    });

    it('should have examples for most terms', () => {
      const terms = getAllTerms();
      const termsWithExamples = terms.filter(termKey => {
        const term = getInsuranceTerm(termKey);
        return term?.example && term.example.length > 0;
      });

      // At least 80% of terms should have examples
      expect(termsWithExamples.length / terms.length).toBeGreaterThan(0.8);
    });
  });
});
