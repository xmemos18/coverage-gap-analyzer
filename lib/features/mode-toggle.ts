/**
 * Mode Toggle Service
 *
 * Provides utilities for switching between Consumer and Broker modes.
 * Each mode enables different features and UI elements.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Application modes
 */
export type AppMode = 'consumer' | 'broker';

/**
 * Feature flags for each mode
 */
export interface ModeFeatures {
  // Consumer features
  showSimplifiedUI: boolean;
  showEducationalContent: boolean;
  showBasicCalculators: boolean;

  // Broker features
  showClientManagement: boolean;
  showBulkOperations: boolean;
  showAdvancedCalculators: boolean;
  showAuditLogs: boolean;
  showExportTools: boolean;
  showComparisonTools: boolean;
  showBrandingOptions: boolean;
}

/**
 * Default feature flags for consumer mode
 */
const CONSUMER_FEATURES: ModeFeatures = {
  showSimplifiedUI: true,
  showEducationalContent: true,
  showBasicCalculators: true,
  showClientManagement: false,
  showBulkOperations: false,
  showAdvancedCalculators: false,
  showAuditLogs: false,
  showExportTools: false,
  showComparisonTools: true,
  showBrandingOptions: false,
};

/**
 * Default feature flags for broker mode
 */
const BROKER_FEATURES: ModeFeatures = {
  showSimplifiedUI: false,
  showEducationalContent: false,
  showBasicCalculators: true,
  showClientManagement: true,
  showBulkOperations: true,
  showAdvancedCalculators: true,
  showAuditLogs: true,
  showExportTools: true,
  showComparisonTools: true,
  showBrandingOptions: true,
};

/**
 * Mode configuration
 */
export interface ModeConfig {
  mode: AppMode;
  features: ModeFeatures;
  brokerInfo?: {
    name: string;
    company: string;
    license?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * Mode store state
 */
interface ModeState {
  mode: AppMode;
  features: ModeFeatures;
  brokerInfo: ModeConfig['brokerInfo'];
  isAuthenticated: boolean;

  // Actions
  setMode: (mode: AppMode) => void;
  toggleFeature: (feature: keyof ModeFeatures) => void;
  setBrokerInfo: (info: ModeConfig['brokerInfo']) => void;
  setAuthenticated: (authenticated: boolean) => void;
  reset: () => void;
}

/**
 * Zustand store for mode management
 */
export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'consumer',
      features: CONSUMER_FEATURES,
      brokerInfo: undefined,
      isAuthenticated: false,

      setMode: (mode) =>
        set({
          mode,
          features: mode === 'broker' ? BROKER_FEATURES : CONSUMER_FEATURES,
        }),

      toggleFeature: (feature) =>
        set((state) => ({
          features: {
            ...state.features,
            [feature]: !state.features[feature],
          },
        })),

      setBrokerInfo: (brokerInfo) =>
        set({ brokerInfo }),

      setAuthenticated: (isAuthenticated) =>
        set({ isAuthenticated }),

      reset: () =>
        set({
          mode: 'consumer',
          features: CONSUMER_FEATURES,
          brokerInfo: undefined,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'coverage-mode-storage',
    }
  )
);

/**
 * Get features for a specific mode
 */
export function getFeaturesForMode(mode: AppMode): ModeFeatures {
  return mode === 'broker' ? BROKER_FEATURES : CONSUMER_FEATURES;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(features: ModeFeatures, feature: keyof ModeFeatures): boolean {
  return features[feature];
}

/**
 * Mode display names
 */
export const MODE_DISPLAY_NAMES: Record<AppMode, string> = {
  consumer: 'Personal',
  broker: 'Professional',
};

/**
 * Mode descriptions
 */
export const MODE_DESCRIPTIONS: Record<AppMode, string> = {
  consumer: 'For individuals and families looking for coverage guidance',
  broker: 'For insurance professionals managing multiple clients',
};

/**
 * Feature display names
 */
export const FEATURE_DISPLAY_NAMES: Record<keyof ModeFeatures, string> = {
  showSimplifiedUI: 'Simplified Interface',
  showEducationalContent: 'Educational Content',
  showBasicCalculators: 'Basic Calculators',
  showClientManagement: 'Client Management',
  showBulkOperations: 'Bulk Operations',
  showAdvancedCalculators: 'Advanced Calculators',
  showAuditLogs: 'Audit Logs',
  showExportTools: 'Export Tools',
  showComparisonTools: 'Comparison Tools',
  showBrandingOptions: 'Branding Options',
};

/**
 * Feature descriptions
 */
export const FEATURE_DESCRIPTIONS: Record<keyof ModeFeatures, string> = {
  showSimplifiedUI: 'Streamlined interface for easier navigation',
  showEducationalContent: 'Explanations and tips throughout the app',
  showBasicCalculators: 'Standard cost and subsidy calculators',
  showClientManagement: 'Manage client profiles and scenarios',
  showBulkOperations: 'Process multiple clients at once',
  showAdvancedCalculators: 'Monte Carlo, MAGI optimization, etc.',
  showAuditLogs: 'Track all calculations for compliance',
  showExportTools: 'Export reports and data in various formats',
  showComparisonTools: 'Side-by-side plan comparison',
  showBrandingOptions: 'Customize reports with your branding',
};

/**
 * Hook to check if current mode is broker
 */
export function useIsBrokerMode(): boolean {
  return useModeStore((state) => state.mode === 'broker');
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(feature: keyof ModeFeatures): boolean {
  return useModeStore((state) => state.features[feature]);
}

/**
 * Hook to get current mode config
 */
export function useModeConfig(): ModeConfig {
  return useModeStore((state) => ({
    mode: state.mode,
    features: state.features,
    brokerInfo: state.brokerInfo,
  }));
}

// Export constants for testing
export const _internal = {
  CONSUMER_FEATURES,
  BROKER_FEATURES,
};
