/**
 * Custom hook for calculator data persistence
 * Handles loading, saving, and clearing calculator form data
 */

import { useEffect, useCallback } from 'react';
import { CalculatorFormData } from '@/types';
import { loadCalculatorData, saveCalculatorData, clearCalculatorData, isDataRecent } from '@/lib/localStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import { logger } from '@/lib/logger';

interface UseCalculatorPersistenceProps {
  /**
   * Callback when data is loaded successfully
   */
  onDataLoaded?: (data: CalculatorFormData) => void;

  /**
   * Whether to auto-load data on mount
   */
  autoLoad?: boolean;

  /**
   * Whether to auto-save data (used with debounced saves)
   */
  autoSave?: boolean;
}

export function useCalculatorPersistence({
  onDataLoaded,
  autoLoad = true,
  autoSave = false,
}: UseCalculatorPersistenceProps = {}) {

  /**
   * Load saved calculator data (async with race condition protection)
   */
  const loadData = useCallback(async () => {
    const result = await loadCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);

    if (result.success && result.data) {
      // Check if data is recent (within 24 hours)
      if (isDataRecent(result.data)) {
        onDataLoaded?.(result.data);
        return { success: true, data: result.data };
      } else {
        // Data is too old, clear it (async)
        const clearResult = await clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
        if (!clearResult.success) {
          logger.error('Failed to clear old data', clearResult.error);
        }
        return { success: false, error: 'Data expired' };
      }
    } else if (result.error) {
      // Invalid or corrupted data - log and clear (async)
      logger.error('Failed to load saved calculator data', result.error);
      const clearResult = await clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
      if (!clearResult.success) {
        logger.error('Failed to clear corrupted data', clearResult.error);
      }
      return { success: false, error: result.error };
    }

    return { success: false, error: 'No data found' };
  }, [onDataLoaded]);

  /**
   * Save calculator data (async)
   */
  const saveData = useCallback(async (data: CalculatorFormData) => {
    const result = await saveCalculatorData(STORAGE_KEYS.CALCULATOR_DATA, data, true);

    if (!result.success) {
      logger.error('Failed to save calculator data', result.error);
      return false;
    }

    return true;
  }, []);

  /**
   * Clear saved calculator data (async)
   */
  const clearData = useCallback(async () => {
    const result = await clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);

    if (!result.success) {
      logger.error('Failed to clear saved calculator data', result.error);
      return false;
    }

    return true;
  }, []);

  /**
   * Auto-load data on mount if enabled
   */
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    loadData,
    saveData,
    clearData,
  };
}
