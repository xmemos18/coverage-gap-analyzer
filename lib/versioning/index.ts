/**
 * Versioning Module
 *
 * Exports scenario versioning utilities for save/load functionality.
 */

export {
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
  type SavedScenario,
  type ScenarioVersion,
  type VersionedScenario,
} from './scenario-versioning';
