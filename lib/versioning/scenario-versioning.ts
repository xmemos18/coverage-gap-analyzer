/**
 * Scenario Versioning Service
 *
 * Provides utilities for saving, loading, and managing scenario versions.
 * Uses localStorage for client-side persistence.
 */

import { type ShareableScenario } from '@/lib/sharing';

/**
 * Saved scenario with metadata
 */
export interface SavedScenario {
  id: string;
  name: string;
  scenario: ShareableScenario;
  createdAt: number;
  updatedAt: number;
  version: number;
  notes?: string;
}

/**
 * Scenario version history entry
 */
export interface ScenarioVersion {
  version: number;
  scenario: ShareableScenario;
  savedAt: number;
  changeNote?: string;
}

/**
 * Saved scenario with version history
 */
export interface VersionedScenario {
  id: string;
  name: string;
  currentVersion: number;
  history: ScenarioVersion[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Storage key prefix
 */
const STORAGE_KEY = 'coverage_scenarios';
const VERSION_KEY = 'coverage_scenario_versions';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `scn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Get all saved scenarios from localStorage
 */
export function getSavedScenarios(): SavedScenario[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const scenarios = JSON.parse(stored) as SavedScenario[];
    // Sort by updatedAt descending (most recent first)
    return scenarios.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * Get a single saved scenario by ID
 */
export function getSavedScenario(id: string): SavedScenario | null {
  const scenarios = getSavedScenarios();
  return scenarios.find((s) => s.id === id) || null;
}

/**
 * Save a new scenario
 */
export function saveScenario(
  scenario: ShareableScenario,
  name: string,
  notes?: string
): SavedScenario {
  if (typeof window === 'undefined') {
    throw new Error('saveScenario is only available in browser environments');
  }

  const now = Date.now();
  const saved: SavedScenario = {
    id: generateId(),
    name,
    scenario,
    createdAt: now,
    updatedAt: now,
    version: 1,
    notes,
  };

  const scenarios = getSavedScenarios();
  scenarios.push(saved);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));

  // Initialize version history
  saveVersionHistory(saved.id, [
    {
      version: 1,
      scenario,
      savedAt: now,
      changeNote: 'Initial save',
    },
  ]);

  return saved;
}

/**
 * Update an existing scenario
 */
export function updateScenario(
  id: string,
  updates: Partial<Pick<SavedScenario, 'name' | 'scenario' | 'notes'>>,
  changeNote?: string
): SavedScenario | null {
  if (typeof window === 'undefined') {
    throw new Error('updateScenario is only available in browser environments');
  }

  const scenarios = getSavedScenarios();
  const index = scenarios.findIndex((s) => s.id === id);

  if (index === -1) return null;

  const existing = scenarios[index];
  if (!existing) return null;

  const now = Date.now();
  const newVersion = existing.version + 1;

  const updated: SavedScenario = {
    ...existing,
    ...updates,
    updatedAt: now,
    version: newVersion,
  };

  scenarios[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));

  // Update version history if scenario changed
  if (updates.scenario) {
    const history = getVersionHistory(id);
    history.push({
      version: newVersion,
      scenario: updates.scenario,
      savedAt: now,
      changeNote,
    });
    saveVersionHistory(id, history);
  }

  return updated;
}

/**
 * Delete a saved scenario
 */
export function deleteScenario(id: string): boolean {
  if (typeof window === 'undefined') {
    throw new Error('deleteScenario is only available in browser environments');
  }

  const scenarios = getSavedScenarios();
  const filtered = scenarios.filter((s) => s.id !== id);

  if (filtered.length === scenarios.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  // Clean up version history
  const versionsRaw = localStorage.getItem(VERSION_KEY);
  if (versionsRaw) {
    const versions = JSON.parse(versionsRaw) as Record<string, ScenarioVersion[]>;
    delete versions[id];
    localStorage.setItem(VERSION_KEY, JSON.stringify(versions));
  }

  return true;
}

/**
 * Duplicate a saved scenario
 */
export function duplicateScenario(id: string, newName?: string): SavedScenario | null {
  const original = getSavedScenario(id);
  if (!original) return null;

  const name = newName || `${original.name} (Copy)`;
  return saveScenario(original.scenario, name, original.notes);
}

/**
 * Get version history for a scenario
 */
export function getVersionHistory(id: string): ScenarioVersion[] {
  if (typeof window === 'undefined') return [];

  try {
    const versionsRaw = localStorage.getItem(VERSION_KEY);
    if (!versionsRaw) return [];

    const versions = JSON.parse(versionsRaw) as Record<string, ScenarioVersion[]>;
    return versions[id] || [];
  } catch {
    return [];
  }
}

/**
 * Save version history for a scenario
 */
function saveVersionHistory(id: string, history: ScenarioVersion[]): void {
  if (typeof window === 'undefined') return;

  try {
    const versionsRaw = localStorage.getItem(VERSION_KEY);
    const versions = versionsRaw
      ? (JSON.parse(versionsRaw) as Record<string, ScenarioVersion[]>)
      : {};

    versions[id] = history;
    localStorage.setItem(VERSION_KEY, JSON.stringify(versions));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Restore a specific version of a scenario
 */
export function restoreVersion(id: string, version: number): SavedScenario | null {
  const history = getVersionHistory(id);
  const versionEntry = history.find((v) => v.version === version);

  if (!versionEntry) return null;

  return updateScenario(id, { scenario: versionEntry.scenario }, `Restored to version ${version}`);
}

/**
 * Compare two versions of a scenario
 */
export function compareVersions(
  id: string,
  versionA: number,
  versionB: number
): { versionA: ScenarioVersion | null; versionB: ScenarioVersion | null; differences: string[] } {
  const history = getVersionHistory(id);
  const a = history.find((v) => v.version === versionA) || null;
  const b = history.find((v) => v.version === versionB) || null;

  const differences: string[] = [];

  if (a && b) {
    const scenarioA = a.scenario;
    const scenarioB = b.scenario;

    if (scenarioA.zip !== scenarioB.zip) {
      differences.push(`ZIP: ${scenarioA.zip} → ${scenarioB.zip}`);
    }
    if (scenarioA.adults !== scenarioB.adults) {
      differences.push(`Adults: ${scenarioA.adults} → ${scenarioB.adults}`);
    }
    if (scenarioA.children !== scenarioB.children) {
      differences.push(`Children: ${scenarioA.children} → ${scenarioB.children}`);
    }
    if (scenarioA.income !== scenarioB.income) {
      differences.push(`Income: $${scenarioA.income.toLocaleString()} → $${scenarioB.income.toLocaleString()}`);
    }
    if (scenarioA.chronic !== scenarioB.chronic) {
      differences.push(`Chronic conditions: ${scenarioA.chronic} → ${scenarioB.chronic}`);
    }
    if (scenarioA.priority !== scenarioB.priority) {
      differences.push(`Priority: ${scenarioA.priority} → ${scenarioB.priority}`);
    }
    if (scenarioA.planType !== scenarioB.planType) {
      differences.push(`Plan type: ${scenarioA.planType} → ${scenarioB.planType}`);
    }
    if (scenarioA.budget !== scenarioB.budget) {
      differences.push(`Budget: ${scenarioA.budget || 'none'} → ${scenarioB.budget || 'none'}`);
    }
  }

  return { versionA: a, versionB: b, differences };
}

/**
 * Export all scenarios as JSON
 */
export function exportScenarios(): string {
  const scenarios = getSavedScenarios();
  const versionsRaw = typeof window !== 'undefined' ? localStorage.getItem(VERSION_KEY) : null;
  const versions = versionsRaw ? JSON.parse(versionsRaw) : {};

  return JSON.stringify(
    {
      exportedAt: Date.now(),
      scenarios,
      versions,
    },
    null,
    2
  );
}

/**
 * Import scenarios from JSON
 */
export function importScenarios(json: string): { imported: number; errors: string[] } {
  if (typeof window === 'undefined') {
    throw new Error('importScenarios is only available in browser environments');
  }

  const errors: string[] = [];
  let imported = 0;

  try {
    const data = JSON.parse(json) as {
      scenarios: SavedScenario[];
      versions: Record<string, ScenarioVersion[]>;
    };

    if (!Array.isArray(data.scenarios)) {
      errors.push('Invalid import format: scenarios must be an array');
      return { imported, errors };
    }

    const existing = getSavedScenarios();
    const existingIds = new Set(existing.map((s) => s.id));

    for (const scenario of data.scenarios) {
      if (!scenario.id || !scenario.name || !scenario.scenario) {
        errors.push(`Skipped invalid scenario: ${scenario.name || 'unknown'}`);
        continue;
      }

      if (existingIds.has(scenario.id)) {
        // Generate new ID to avoid collision
        scenario.id = generateId();
      }

      existing.push(scenario);
      imported++;

      // Import version history if available
      const versionHistory = data.versions?.[scenario.id];
      if (versionHistory) {
        saveVersionHistory(scenario.id, versionHistory);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { imported, errors };
}

/**
 * Clear all saved scenarios
 */
export function clearAllScenarios(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERSION_KEY);
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { scenarioCount: number; storageUsed: string } {
  if (typeof window === 'undefined') {
    return { scenarioCount: 0, storageUsed: '0 KB' };
  }

  const scenarios = getSavedScenarios();
  const scenariosSize = localStorage.getItem(STORAGE_KEY)?.length || 0;
  const versionsSize = localStorage.getItem(VERSION_KEY)?.length || 0;

  const totalBytes = (scenariosSize + versionsSize) * 2; // UTF-16 encoding
  const kb = Math.round(totalBytes / 1024);

  return {
    scenarioCount: scenarios.length,
    storageUsed: kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`,
  };
}
