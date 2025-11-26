/**
 * Scenario Versioning Tests
 */

import { type ShareableScenario } from '@/lib/sharing';
import {
  getSavedScenarios,
  getSavedScenario,
  saveScenario,
  updateScenario,
  deleteScenario,
  duplicateScenario,
  getVersionHistory,
  restoreVersion,
  compareVersions,
  exportScenarios,
  importScenarios,
  clearAllScenarios,
  getStorageInfo,
} from '../scenario-versioning';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Scenario Versioning', () => {
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

  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('saveScenario', () => {
    it('should save a new scenario', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'My Scenario');

      expect(saved.id).toBeDefined();
      expect(saved.id).toMatch(/^scn_/);
      expect(saved.name).toBe('My Scenario');
      expect(saved.scenario).toEqual(scenario);
      expect(saved.version).toBe(1);
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('should save with notes', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test', 'These are my notes');

      expect(saved.notes).toBe('These are my notes');
    });

    it('should create initial version history', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');

      const history = getVersionHistory(saved.id);
      expect(history.length).toBe(1);
      expect(history[0].version).toBe(1);
      expect(history[0].changeNote).toBe('Initial save');
    });
  });

  describe('getSavedScenarios', () => {
    it('should return empty array when no scenarios saved', () => {
      const scenarios = getSavedScenarios();
      expect(scenarios).toEqual([]);
    });

    it('should return saved scenarios sorted by updatedAt', async () => {
      const scenario = createBaseScenario();
      saveScenario(scenario, 'First');

      // Wait a bit to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));
      saveScenario(scenario, 'Second');

      await new Promise((r) => setTimeout(r, 10));
      saveScenario(scenario, 'Third');

      const scenarios = getSavedScenarios();
      expect(scenarios.length).toBe(3);
      // Most recently saved should be first
      expect(scenarios[0].name).toBe('Third');
      expect(scenarios[1].name).toBe('Second');
      expect(scenarios[2].name).toBe('First');
    });
  });

  describe('getSavedScenario', () => {
    it('should return scenario by ID', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');

      const retrieved = getSavedScenario(saved.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Test');
    });

    it('should return null for non-existent ID', () => {
      const retrieved = getSavedScenario('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('updateScenario', () => {
    it('should update scenario name', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Original');

      const updated = updateScenario(saved.id, { name: 'Updated Name' });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.version).toBe(2);
    });

    it('should update scenario data and add to history', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');

      const newScenario = createBaseScenario({ income: 100000 });
      updateScenario(saved.id, { scenario: newScenario }, 'Increased income');

      const history = getVersionHistory(saved.id);
      expect(history.length).toBe(2);
      expect(history[1].scenario.income).toBe(100000);
      expect(history[1].changeNote).toBe('Increased income');
    });

    it('should return null for non-existent ID', () => {
      const result = updateScenario('non-existent', { name: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('deleteScenario', () => {
    it('should delete existing scenario', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');

      const result = deleteScenario(saved.id);
      expect(result).toBe(true);

      const retrieved = getSavedScenario(saved.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent ID', () => {
      const result = deleteScenario('non-existent');
      expect(result).toBe(false);
    });

    it('should clean up version history', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');
      updateScenario(saved.id, { scenario: createBaseScenario({ income: 80000 }) });

      deleteScenario(saved.id);

      const history = getVersionHistory(saved.id);
      expect(history).toEqual([]);
    });
  });

  describe('duplicateScenario', () => {
    it('should create a copy of scenario', () => {
      const scenario = createBaseScenario();
      const original = saveScenario(scenario, 'Original', 'Notes');

      const duplicate = duplicateScenario(original.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate?.id).not.toBe(original.id);
      expect(duplicate?.name).toBe('Original (Copy)');
      expect(duplicate?.scenario).toEqual(scenario);
      expect(duplicate?.notes).toBe('Notes');
    });

    it('should use custom name if provided', () => {
      const scenario = createBaseScenario();
      const original = saveScenario(scenario, 'Original');

      const duplicate = duplicateScenario(original.id, 'Custom Name');

      expect(duplicate?.name).toBe('Custom Name');
    });

    it('should return null for non-existent ID', () => {
      const result = duplicateScenario('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Version History', () => {
    it('should track multiple versions', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');

      updateScenario(saved.id, { scenario: createBaseScenario({ income: 80000 }) });
      updateScenario(saved.id, { scenario: createBaseScenario({ income: 90000 }) });
      updateScenario(saved.id, { scenario: createBaseScenario({ income: 100000 }) });

      const history = getVersionHistory(saved.id);
      expect(history.length).toBe(4);
      expect(history[0].version).toBe(1);
      expect(history[3].version).toBe(4);
    });
  });

  describe('restoreVersion', () => {
    it('should restore a previous version', () => {
      const scenario = createBaseScenario({ income: 50000 });
      const saved = saveScenario(scenario, 'Test');

      updateScenario(saved.id, { scenario: createBaseScenario({ income: 100000 }) });

      const restored = restoreVersion(saved.id, 1);

      expect(restored?.scenario.income).toBe(50000);
      expect(restored?.version).toBe(3); // New version created
    });

    it('should return null for non-existent version', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');

      const result = restoreVersion(saved.id, 999);
      expect(result).toBeNull();
    });
  });

  describe('compareVersions', () => {
    it('should identify differences between versions', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');

      updateScenario(saved.id, {
        scenario: createBaseScenario({
          income: 100000,
          adults: 3,
          chronic: true,
        }),
      });

      const comparison = compareVersions(saved.id, 1, 2);

      expect(comparison.versionA).not.toBeNull();
      expect(comparison.versionB).not.toBeNull();
      expect(comparison.differences.length).toBeGreaterThan(0);
      expect(comparison.differences.some((d) => d.includes('Income'))).toBe(true);
      expect(comparison.differences.some((d) => d.includes('Adults'))).toBe(true);
      expect(comparison.differences.some((d) => d.includes('Chronic'))).toBe(true);
    });

    it('should return empty differences for identical versions', () => {
      const scenario = createBaseScenario();
      const saved = saveScenario(scenario, 'Test');

      const comparison = compareVersions(saved.id, 1, 1);

      expect(comparison.differences).toEqual([]);
    });
  });

  describe('Export/Import', () => {
    it('should export all scenarios', () => {
      const scenario = createBaseScenario();
      saveScenario(scenario, 'First');
      saveScenario(scenario, 'Second');

      const exported = exportScenarios();
      const data = JSON.parse(exported);

      expect(data.exportedAt).toBeDefined();
      expect(data.scenarios.length).toBe(2);
    });

    it('should import scenarios', () => {
      const scenario = createBaseScenario();
      saveScenario(scenario, 'Original');
      const exported = exportScenarios();

      clearAllScenarios();
      expect(getSavedScenarios().length).toBe(0);

      const result = importScenarios(exported);

      expect(result.imported).toBe(1);
      expect(result.errors).toEqual([]);
      expect(getSavedScenarios().length).toBe(1);
    });

    it('should generate new IDs for duplicates', () => {
      const scenario = createBaseScenario();
      saveScenario(scenario, 'Original');
      const exported = exportScenarios();

      // Import without clearing - should generate new ID
      const result = importScenarios(exported);

      expect(result.imported).toBe(1);
      const scenarios = getSavedScenarios();
      expect(scenarios.length).toBe(2);
      expect(scenarios[0].id).not.toBe(scenarios[1].id);
    });

    it('should handle invalid import data', () => {
      const result = importScenarios('not json');

      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllScenarios', () => {
    it('should remove all scenarios', () => {
      const scenario = createBaseScenario();
      saveScenario(scenario, 'First');
      saveScenario(scenario, 'Second');

      clearAllScenarios();

      expect(getSavedScenarios()).toEqual([]);
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', () => {
      const scenario = createBaseScenario();
      saveScenario(scenario, 'Test');

      const info = getStorageInfo();

      expect(info.scenarioCount).toBe(1);
      expect(info.storageUsed).toMatch(/\d+\s*(KB|MB)/);
    });

    it('should return zero for empty storage', () => {
      const info = getStorageInfo();

      expect(info.scenarioCount).toBe(0);
    });
  });
});
