import { getStateFromZip, isValidZipCode } from '../zipToState';

describe('ZIP Code to State Mapping', () => {
  describe('getStateFromZip', () => {
    it('should return correct state for New York ZIP codes', () => {
      expect(getStateFromZip('10001')).toBe('NY'); // Manhattan
      expect(getStateFromZip('11201')).toBe('NY'); // Brooklyn
      expect(getStateFromZip('14850')).toBe('NY'); // Ithaca
    });

    it('should return correct state for California ZIP codes', () => {
      expect(getStateFromZip('90001')).toBe('CA'); // Los Angeles
      expect(getStateFromZip('94102')).toBe('CA'); // San Francisco
      expect(getStateFromZip('92101')).toBe('CA'); // San Diego
    });

    it('should return correct state for Florida ZIP codes', () => {
      expect(getStateFromZip('33101')).toBe('FL'); // Miami
      expect(getStateFromZip('32801')).toBe('FL'); // Orlando
      expect(getStateFromZip('33301')).toBe('FL'); // Fort Lauderdale
    });

    it('should return correct state for Texas ZIP codes', () => {
      expect(getStateFromZip('75001')).toBe('TX'); // Dallas area
      expect(getStateFromZip('77001')).toBe('TX'); // Houston
      expect(getStateFromZip('78701')).toBe('TX'); // Austin
    });

    it('should return correct state for Illinois ZIP codes', () => {
      expect(getStateFromZip('60601')).toBe('IL'); // Chicago
      expect(getStateFromZip('62701')).toBe('IL'); // Springfield
    });

    it('should return correct state for Massachusetts ZIP codes', () => {
      expect(getStateFromZip('02101')).toBe('MA'); // Boston
      expect(getStateFromZip('01001')).toBe('MA'); // Western MA
    });

    it('should return correct state for various other states', () => {
      expect(getStateFromZip('98101')).toBe('WA'); // Seattle
      expect(getStateFromZip('97201')).toBe('OR'); // Portland
      expect(getStateFromZip('85001')).toBe('AZ'); // Phoenix
      expect(getStateFromZip('80201')).toBe('CO'); // Denver
      expect(getStateFromZip('30301')).toBe('GA'); // Atlanta
    });

    it('should return null for invalid ZIP codes', () => {
      expect(getStateFromZip('')).toBeNull();
      expect(getStateFromZip('123')).toBeNull();
      expect(getStateFromZip('1234567')).toBeNull();
      expect(getStateFromZip('00000')).toBeNull();
      expect(getStateFromZip('abcde')).toBeNull();
    });

    it('should handle edge cases', () => {
      expect(getStateFromZip('00001')).toBeNull(); // Too low
      expect(getStateFromZip('99999')).toBe('AK'); // Alaska
    });
  });

  describe('isValidZipCode', () => {
    it('should return true for valid ZIP codes', () => {
      expect(isValidZipCode('10001')).toBe(true);
      expect(isValidZipCode('90001')).toBe(true);
      expect(isValidZipCode('33101')).toBe(true);
    });

    it('should return false for invalid ZIP codes', () => {
      expect(isValidZipCode('')).toBe(false);
      expect(isValidZipCode('123')).toBe(false);
      expect(isValidZipCode('00000')).toBe(false);
      expect(isValidZipCode('abcde')).toBe(false);
    });
  });
});
