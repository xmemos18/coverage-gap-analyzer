/**
 * Features Module
 *
 * Exports mode toggle and feature flag utilities.
 */

export {
  useModeStore,
  getFeaturesForMode,
  isFeatureEnabled,
  useIsBrokerMode,
  useFeature,
  useModeConfig,
  MODE_DISPLAY_NAMES,
  MODE_DESCRIPTIONS,
  FEATURE_DISPLAY_NAMES,
  FEATURE_DESCRIPTIONS,
  type AppMode,
  type ModeFeatures,
  type ModeConfig,
} from './mode-toggle';
