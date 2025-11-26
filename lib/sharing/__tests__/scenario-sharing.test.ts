/**
 * Scenario Sharing Tests
 */

import {
  encodeScenario,
  decodeScenario,
  generateShareableUrl,
  parseShareableUrl,
  createScenarioHash,
  isValidEncodedScenario,
  getScenarioSummary,
  type ShareableScenario,
} from '../scenario-sharing';

describe('Scenario Sharing', () => {
  const createBaseScenario = (overrides: Partial<ShareableScenario> = {}): ShareableScenario => ({
    v: 1,
    zip: '90210',
    state: 'CA',
    adults: 2,
    children: 1,
    ages: [35, 33, 5],
    chronic: false,
    tobacco: false,
    prescriptions: 2,
    doctorVisits: 4,
    specialistVisits: 1,
    income: 75000,
    budget: 600,
    priority: 'balanced',
    planType: 'any',
    hasEmployer: false,
    ...overrides,
  });

  describe('encodeScenario', () => {
    it('should encode a valid scenario to base64url string', () => {
      const scenario = createBaseScenario();
      const encoded = encodeScenario(scenario);

      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
      // Base64url uses only alphanumeric, -, and _
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should produce URL-safe strings', () => {
      const scenario = createBaseScenario();
      const encoded = encodeScenario(scenario);

      // Should not contain +, /, or =
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });

    it('should produce shorter output for minimal scenarios', () => {
      const minimal: ShareableScenario = {
        v: 1,
        zip: '10001',
        state: 'NY',
        adults: 1,
        children: 0,
        ages: [30],
        income: 50000,
        chronic: false,
        tobacco: false,
        prescriptions: 0,
        doctorVisits: 0,
        specialistVisits: 0,
        priority: 'balanced',
        planType: 'any',
        hasEmployer: false,
      };

      const full = createBaseScenario({
        chronic: true,
        tobacco: true,
        prescriptions: 10,
        doctorVisits: 12,
        specialistVisits: 6,
        budget: 1000,
        employerContribution: 500,
        currentPremium: 800,
        currentDeductible: 2500,
      });

      const minimalEncoded = encodeScenario(minimal);
      const fullEncoded = encodeScenario(full);

      expect(minimalEncoded.length).toBeLessThan(fullEncoded.length);
    });

    it('should throw on invalid scenario', () => {
      const invalid = {
        zip: '90210',
        // Missing required fields
      } as unknown as ShareableScenario;

      expect(() => encodeScenario(invalid)).toThrow();
    });
  });

  describe('decodeScenario', () => {
    it('should decode encoded scenario back to original', () => {
      const original = createBaseScenario();
      const encoded = encodeScenario(original);
      const decoded = decodeScenario(encoded);

      expect(decoded.zip).toBe(original.zip);
      expect(decoded.state).toBe(original.state);
      expect(decoded.adults).toBe(original.adults);
      expect(decoded.children).toBe(original.children);
      expect(decoded.ages).toEqual(original.ages);
      expect(decoded.income).toBe(original.income);
    });

    it('should decode boolean flags correctly', () => {
      const original = createBaseScenario({
        chronic: true,
        tobacco: true,
        hasEmployer: true,
      });

      const encoded = encodeScenario(original);
      const decoded = decodeScenario(encoded);

      expect(decoded.chronic).toBe(true);
      expect(decoded.tobacco).toBe(true);
      expect(decoded.hasEmployer).toBe(true);
    });

    it('should decode priority enum correctly', () => {
      const priorities: Array<'low-premium' | 'balanced' | 'comprehensive'> = [
        'low-premium',
        'balanced',
        'comprehensive',
      ];

      for (const priority of priorities) {
        const scenario = createBaseScenario({ priority });
        const encoded = encodeScenario(scenario);
        const decoded = decodeScenario(encoded);

        expect(decoded.priority).toBe(priority);
      }
    });

    it('should decode planType enum correctly', () => {
      const planTypes: Array<'any' | 'hmo' | 'ppo' | 'epo' | 'hdhp'> = [
        'any',
        'hmo',
        'ppo',
        'epo',
        'hdhp',
      ];

      for (const planType of planTypes) {
        const scenario = createBaseScenario({ planType });
        const encoded = encodeScenario(scenario);
        const decoded = decodeScenario(encoded);

        expect(decoded.planType).toBe(planType);
      }
    });

    it('should throw on invalid encoded string', () => {
      expect(() => decodeScenario('invalid-base64')).toThrow('Invalid scenario data');
      expect(() => decodeScenario('')).toThrow();
    });

    it('should throw on malformed JSON', () => {
      // Valid base64 but invalid JSON
      const badData = Buffer.from('not json', 'utf-8').toString('base64url');
      expect(() => decodeScenario(badData)).toThrow('Invalid scenario data');
    });
  });

  describe('generateShareableUrl', () => {
    it('should generate URL with /share/ path', () => {
      const scenario = createBaseScenario();
      const url = generateShareableUrl(scenario);

      expect(url).toMatch(/^\/share\/[A-Za-z0-9_-]+$/);
    });

    it('should include base URL when provided', () => {
      const scenario = createBaseScenario();
      const url = generateShareableUrl(scenario, 'https://example.com');

      expect(url).toMatch(/^https:\/\/example\.com\/share\/[A-Za-z0-9_-]+$/);
    });

    it('should add timestamp if not present', () => {
      const scenario = createBaseScenario();
      const url = generateShareableUrl(scenario);

      const parsed = parseShareableUrl(url);
      expect(parsed?.ts).toBeDefined();
      expect(typeof parsed?.ts).toBe('number');
    });

    it('should preserve existing timestamp', () => {
      const ts = 1704067200000; // 2024-01-01
      const scenario = createBaseScenario({ ts });
      const url = generateShareableUrl(scenario);

      const parsed = parseShareableUrl(url);
      expect(parsed?.ts).toBe(ts);
    });
  });

  describe('parseShareableUrl', () => {
    it('should extract scenario from full URL', () => {
      const original = createBaseScenario();
      const url = generateShareableUrl(original, 'https://example.com');
      const parsed = parseShareableUrl(url);

      expect(parsed).not.toBeNull();
      expect(parsed?.zip).toBe(original.zip);
      expect(parsed?.income).toBe(original.income);
    });

    it('should extract scenario from path only', () => {
      const original = createBaseScenario();
      const url = generateShareableUrl(original);
      const parsed = parseShareableUrl(url);

      expect(parsed).not.toBeNull();
      expect(parsed?.zip).toBe(original.zip);
    });

    it('should return null for invalid URL format', () => {
      expect(parseShareableUrl('/invalid/path')).toBeNull();
      expect(parseShareableUrl('/share/')).toBeNull();
      expect(parseShareableUrl('https://example.com/other')).toBeNull();
    });

    it('should return null for invalid encoded data', () => {
      expect(parseShareableUrl('/share/invalid!')).toBeNull();
    });
  });

  describe('createScenarioHash', () => {
    it('should create short hash string', () => {
      const scenario = createBaseScenario();
      const hash = createScenarioHash(scenario);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeLessThanOrEqual(8);
    });

    it('should produce same hash for same core data', () => {
      const scenario1 = createBaseScenario();
      const scenario2 = createBaseScenario();

      expect(createScenarioHash(scenario1)).toBe(createScenarioHash(scenario2));
    });

    it('should produce different hash for different core data', () => {
      const scenario1 = createBaseScenario({ zip: '90210' });
      const scenario2 = createBaseScenario({ zip: '10001' });

      expect(createScenarioHash(scenario1)).not.toBe(createScenarioHash(scenario2));
    });

    it('should be base36 (alphanumeric)', () => {
      const scenario = createBaseScenario();
      const hash = createScenarioHash(scenario);

      expect(hash).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('isValidEncodedScenario', () => {
    it('should return true for valid encoded scenario', () => {
      const scenario = createBaseScenario();
      const encoded = encodeScenario(scenario);

      expect(isValidEncodedScenario(encoded)).toBe(true);
    });

    it('should return false for invalid encoded string', () => {
      expect(isValidEncodedScenario('invalid')).toBe(false);
      expect(isValidEncodedScenario('')).toBe(false);
      expect(isValidEncodedScenario('!!!@@@')).toBe(false);
    });

    it('should return false for valid base64 with invalid data', () => {
      const badData = Buffer.from('{}', 'utf-8').toString('base64url');
      expect(isValidEncodedScenario(badData)).toBe(false);
    });
  });

  describe('getScenarioSummary', () => {
    it('should format single adult correctly', () => {
      const scenario = createBaseScenario({ adults: 1, children: 0, ages: [30] });
      const summary = getScenarioSummary(scenario);

      expect(summary).toContain('1 adult');
      expect(summary).not.toContain('child');
    });

    it('should format multiple adults correctly', () => {
      const scenario = createBaseScenario({ adults: 2, children: 0, ages: [30, 28] });
      const summary = getScenarioSummary(scenario);

      expect(summary).toContain('2 adults');
    });

    it('should format single child correctly', () => {
      const scenario = createBaseScenario({ adults: 1, children: 1, ages: [30, 5] });
      const summary = getScenarioSummary(scenario);

      expect(summary).toContain('1 child');
    });

    it('should format multiple children correctly', () => {
      const scenario = createBaseScenario({ adults: 2, children: 3, ages: [35, 33, 10, 8, 5] });
      const summary = getScenarioSummary(scenario);

      expect(summary).toContain('3 children');
    });

    it('should include location', () => {
      const scenario = createBaseScenario({ zip: '90210', state: 'CA' });
      const summary = getScenarioSummary(scenario);

      expect(summary).toContain('90210, CA');
    });

    it('should include formatted income', () => {
      const scenario = createBaseScenario({ income: 75000 });
      const summary = getScenarioSummary(scenario);

      expect(summary).toContain('$75,000/year');
    });
  });

  describe('Round-trip encoding', () => {
    it('should preserve all fields through encode/decode cycle', () => {
      const original: ShareableScenario = {
        v: 1,
        zip: '94105',
        state: 'CA',
        adults: 2,
        children: 2,
        ages: [40, 38, 12, 8],
        chronic: true,
        tobacco: false,
        prescriptions: 5,
        doctorVisits: 8,
        specialistVisits: 3,
        income: 120000,
        budget: 800,
        priority: 'comprehensive',
        planType: 'ppo',
        hasEmployer: true,
        employerContribution: 400,
        currentPremium: 650,
        currentDeductible: 3000,
        ts: 1704067200000,
      };

      const encoded = encodeScenario(original);
      const decoded = decodeScenario(encoded);

      expect(decoded.v).toBe(original.v);
      expect(decoded.zip).toBe(original.zip);
      expect(decoded.state).toBe(original.state);
      expect(decoded.adults).toBe(original.adults);
      expect(decoded.children).toBe(original.children);
      expect(decoded.ages).toEqual(original.ages);
      expect(decoded.chronic).toBe(original.chronic);
      expect(decoded.tobacco).toBe(original.tobacco);
      expect(decoded.prescriptions).toBe(original.prescriptions);
      expect(decoded.doctorVisits).toBe(original.doctorVisits);
      expect(decoded.specialistVisits).toBe(original.specialistVisits);
      expect(decoded.income).toBe(original.income);
      expect(decoded.budget).toBe(original.budget);
      expect(decoded.priority).toBe(original.priority);
      expect(decoded.planType).toBe(original.planType);
      expect(decoded.hasEmployer).toBe(original.hasEmployer);
      expect(decoded.employerContribution).toBe(original.employerContribution);
      expect(decoded.currentPremium).toBe(original.currentPremium);
      expect(decoded.currentDeductible).toBe(original.currentDeductible);
      expect(decoded.ts).toBe(original.ts);
    });

    it('should handle edge case values', () => {
      const edge: ShareableScenario = {
        v: 1,
        zip: '00501', // Lowest ZIP
        state: 'NY',
        adults: 10, // Max adults
        children: 15, // Max children
        ages: [18, 19, 20, 21, 22, 23, 24, 25, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        chronic: true,
        tobacco: true,
        prescriptions: 50, // Max
        doctorVisits: 100, // Max
        specialistVisits: 100, // Max
        income: 9999999,
        budget: 9999,
        priority: 'low-premium',
        planType: 'hdhp',
        hasEmployer: true,
        employerContribution: 5000,
        currentPremium: 2000,
        currentDeductible: 10000,
      };

      const encoded = encodeScenario(edge);
      const decoded = decodeScenario(encoded);

      expect(decoded.adults).toBe(edge.adults);
      expect(decoded.children).toBe(edge.children);
      expect(decoded.prescriptions).toBe(edge.prescriptions);
    });
  });
});
