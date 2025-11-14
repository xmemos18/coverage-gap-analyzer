/**
 * localStorage utilities with validation and error handling
 * Prevents crashes from corrupted or malformed data
 * Includes race condition protection for concurrent operations
 */

import { CalculatorFormData, Residence, CurrentInsurance } from '@/types';
import { logger } from './logger';

// Simple lock mechanism to prevent race conditions
const operationLocks = new Map<string, Promise<unknown>>();

/**
 * Execute localStorage operation with lock protection
 */
async function withLock<T>(key: string, operation: () => T | Promise<T>): Promise<T> {
  // Wait for any existing operation on this key to complete
  const existingLock = operationLocks.get(key);
  if (existingLock) {
    await existingLock.catch(() => {
      // Ignore errors from previous operations
    });
  }

  // Create new lock for this operation
  const operationPromise = Promise.resolve().then(operation);
  operationLocks.set(key, operationPromise);

  try {
    const result = await operationPromise;
    return result;
  } finally {
    // Clean up lock
    operationLocks.delete(key);
  }
}

/**
 * Validate that a value is a Residence object
 */
function isValidResidence(value: unknown): value is Residence {
  if (typeof value !== 'object' || value === null) return false;
  const res = value as Record<string, unknown>;
  return (
    typeof res.zip === 'string' &&
    typeof res.state === 'string' &&
    typeof res.isPrimary === 'boolean' &&
    typeof res.monthsPerYear === 'number'
  );
}

/**
 * Validate that a value is a CurrentInsurance object
 */
function isValidCurrentInsurance(value: unknown): value is CurrentInsurance {
  if (typeof value !== 'object' || value === null) return false;
  const ins = value as Record<string, unknown>;
  return (
    typeof ins.carrier === 'string' &&
    typeof ins.planType === 'string' &&
    typeof ins.monthlyCost === 'number' &&
    typeof ins.deductible === 'number' &&
    typeof ins.outOfPocketMax === 'number' &&
    typeof ins.coverageNotes === 'string'
  );
}

/**
 * Validate that saved data matches CalculatorFormData schema
 */
export function validateCalculatorFormData(data: unknown): data is CalculatorFormData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const formData = data as Record<string, unknown>;

  // Check required array fields
  if (!Array.isArray(formData.residences)) return false;
  if (!Array.isArray(formData.adultAges)) return false;
  if (!Array.isArray(formData.childAges)) return false;

  // Validate residences array (must have at least 1)
  if (formData.residences.length < 1) return false;
  if (!formData.residences.every(isValidResidence)) return false;

  // Check required number fields
  if (typeof formData.numAdults !== 'number') return false;
  if (typeof formData.numChildren !== 'number') return false;
  if (typeof formData.currentStep !== 'number') return false;

  // Check required boolean fields
  if (typeof formData.hasMedicareEligible !== 'boolean') return false;
  if (typeof formData.hasEmployerInsurance !== 'boolean') return false;
  if (typeof formData.hasChronicConditions !== 'boolean') return false;
  if (typeof formData.hasCurrentInsurance !== 'boolean') return false;

  // Check employment & coverage fields
  if (typeof formData.employerContribution !== 'number') return false;

  // Check health profile fields
  if (!Array.isArray(formData.chronicConditions)) return false;
  if (!formData.chronicConditions.every((c) => typeof c === 'string')) return false;
  if (typeof formData.prescriptionCount !== 'string') return false;
  if (typeof formData.providerPreference !== 'string') return false;

  // Check required string fields
  if (typeof formData.budget !== 'string') return false;
  if (typeof formData.incomeRange !== 'string') return false;

  // Validate currentInsurance object
  if (!isValidCurrentInsurance(formData.currentInsurance)) return false;

  // Validate age arrays contain only numbers
  if (!formData.adultAges.every((age) => typeof age === 'number')) return false;
  if (!formData.childAges.every((age) => typeof age === 'number')) return false;

  // All checks passed
  return true;
}

/**
 * Safely parse and validate localStorage data
 * Now with race condition protection
 */
export async function loadCalculatorData(storageKey: string): Promise<{
  success: boolean;
  data?: CalculatorFormData & { timestamp?: number };
  error?: string;
}> {
  return withLock(storageKey, () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        return { success: false, error: 'No saved data found' };
      }

      const parsed = JSON.parse(saved);

      // Validate the structure
      if (!validateCalculatorFormData(parsed)) {
        logger.warn('Invalid calculator data structure in localStorage', { storageKey });
        return { success: false, error: 'Invalid data structure' };
      }

      return { success: true, data: parsed };
    } catch (error) {
      if (error instanceof SyntaxError) {
        logger.error('Corrupted localStorage data (invalid JSON)', { storageKey, error });
        return { success: false, error: 'Corrupted data (invalid JSON)' };
      }
      logger.error('Failed to load calculator data from localStorage', { storageKey, error });
      return { success: false, error: 'Failed to load data' };
    }
  });
}

/**
 * Safely save data to localStorage
 * Now with race condition protection
 */
export async function saveCalculatorData(
  storageKey: string,
  data: CalculatorFormData,
  includeTimestamp = true
): Promise<{ success: boolean; error?: string }> {
  return withLock(storageKey, () => {
    try {
      const dataToSave = includeTimestamp
        ? { ...data, timestamp: Date.now() }
        : data;

      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      return { success: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.error('localStorage quota exceeded', { storageKey, error });
        return { success: false, error: 'Storage quota exceeded' };
      }
      logger.error('Failed to save to localStorage', { storageKey, error });
      return { success: false, error: 'Failed to save data' };
    }
  });
}

/**
 * Safely remove data from localStorage
 * Now with race condition protection
 */
export async function clearCalculatorData(storageKey: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return withLock(storageKey, () => {
    try {
      localStorage.removeItem(storageKey);
      return { success: true };
    } catch (error) {
      logger.error('Failed to clear localStorage', { storageKey, error });
      return { success: false, error: 'Failed to clear data' };
    }
  });
}

/**
 * Check if saved data is recent (within specified hours)
 */
export function isDataRecent(data: unknown, hoursValid = 24): boolean {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;
  const timestamp = obj.timestamp;

  if (typeof timestamp !== 'number') return false;

  const now = Date.now();
  const maxAge = hoursValid * 60 * 60 * 1000;

  return now - timestamp < maxAge;
}
