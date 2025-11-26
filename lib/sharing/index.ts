/**
 * Sharing Module
 *
 * Exports scenario sharing utilities for generating shareable URLs.
 */

export {
  encodeScenario,
  decodeScenario,
  generateShareableUrl,
  parseShareableUrl,
  createScenarioHash,
  isValidEncodedScenario,
  getScenarioSummary,
  ShareableScenarioSchema,
  type ShareableScenario,
} from './scenario-sharing';
