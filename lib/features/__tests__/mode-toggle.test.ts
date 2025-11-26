/**
 * Mode Toggle Tests
 */

import { act, renderHook } from '@testing-library/react';
import {
  useModeStore,
  getFeaturesForMode,
  isFeatureEnabled,
  MODE_DISPLAY_NAMES,
  MODE_DESCRIPTIONS,
  FEATURE_DISPLAY_NAMES,
  FEATURE_DESCRIPTIONS,
  _internal,
  type AppMode,
  type ModeFeatures,
} from '../mode-toggle';

const { CONSUMER_FEATURES, BROKER_FEATURES } = _internal;

describe('Mode Toggle', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useModeStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('useModeStore', () => {
    it('should have consumer mode as default', () => {
      const { result } = renderHook(() => useModeStore());
      expect(result.current.mode).toBe('consumer');
    });

    it('should have consumer features by default', () => {
      const { result } = renderHook(() => useModeStore());
      expect(result.current.features).toEqual(CONSUMER_FEATURES);
    });

    it('should switch to broker mode', () => {
      const { result } = renderHook(() => useModeStore());

      act(() => {
        result.current.setMode('broker');
      });

      expect(result.current.mode).toBe('broker');
      expect(result.current.features).toEqual(BROKER_FEATURES);
    });

    it('should switch back to consumer mode', () => {
      const { result } = renderHook(() => useModeStore());

      act(() => {
        result.current.setMode('broker');
      });

      act(() => {
        result.current.setMode('consumer');
      });

      expect(result.current.mode).toBe('consumer');
      expect(result.current.features).toEqual(CONSUMER_FEATURES);
    });

    it('should toggle individual features', () => {
      const { result } = renderHook(() => useModeStore());

      const initialValue = result.current.features.showAuditLogs;

      act(() => {
        result.current.toggleFeature('showAuditLogs');
      });

      expect(result.current.features.showAuditLogs).toBe(!initialValue);
    });

    it('should set broker info', () => {
      const { result } = renderHook(() => useModeStore());

      const brokerInfo = {
        name: 'John Doe',
        company: 'Insurance Co',
        license: 'ABC123',
      };

      act(() => {
        result.current.setBrokerInfo(brokerInfo);
      });

      expect(result.current.brokerInfo).toEqual(brokerInfo);
    });

    it('should set authenticated state', () => {
      const { result } = renderHook(() => useModeStore());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.setAuthenticated(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should reset to defaults', () => {
      const { result } = renderHook(() => useModeStore());

      act(() => {
        result.current.setMode('broker');
        result.current.setBrokerInfo({ name: 'Test', company: 'Test Co' });
        result.current.setAuthenticated(true);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.mode).toBe('consumer');
      expect(result.current.features).toEqual(CONSUMER_FEATURES);
      expect(result.current.brokerInfo).toBeUndefined();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('getFeaturesForMode', () => {
    it('should return consumer features for consumer mode', () => {
      const features = getFeaturesForMode('consumer');
      expect(features).toEqual(CONSUMER_FEATURES);
    });

    it('should return broker features for broker mode', () => {
      const features = getFeaturesForMode('broker');
      expect(features).toEqual(BROKER_FEATURES);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      expect(isFeatureEnabled(CONSUMER_FEATURES, 'showSimplifiedUI')).toBe(true);
      expect(isFeatureEnabled(BROKER_FEATURES, 'showClientManagement')).toBe(true);
    });

    it('should return false for disabled features', () => {
      expect(isFeatureEnabled(CONSUMER_FEATURES, 'showClientManagement')).toBe(false);
      expect(isFeatureEnabled(BROKER_FEATURES, 'showSimplifiedUI')).toBe(false);
    });
  });

  describe('Consumer Features', () => {
    it('should enable simplified UI', () => {
      expect(CONSUMER_FEATURES.showSimplifiedUI).toBe(true);
    });

    it('should enable educational content', () => {
      expect(CONSUMER_FEATURES.showEducationalContent).toBe(true);
    });

    it('should enable basic calculators', () => {
      expect(CONSUMER_FEATURES.showBasicCalculators).toBe(true);
    });

    it('should disable client management', () => {
      expect(CONSUMER_FEATURES.showClientManagement).toBe(false);
    });

    it('should disable bulk operations', () => {
      expect(CONSUMER_FEATURES.showBulkOperations).toBe(false);
    });

    it('should disable advanced calculators', () => {
      expect(CONSUMER_FEATURES.showAdvancedCalculators).toBe(false);
    });

    it('should disable audit logs', () => {
      expect(CONSUMER_FEATURES.showAuditLogs).toBe(false);
    });

    it('should enable comparison tools', () => {
      expect(CONSUMER_FEATURES.showComparisonTools).toBe(true);
    });
  });

  describe('Broker Features', () => {
    it('should disable simplified UI', () => {
      expect(BROKER_FEATURES.showSimplifiedUI).toBe(false);
    });

    it('should enable client management', () => {
      expect(BROKER_FEATURES.showClientManagement).toBe(true);
    });

    it('should enable bulk operations', () => {
      expect(BROKER_FEATURES.showBulkOperations).toBe(true);
    });

    it('should enable advanced calculators', () => {
      expect(BROKER_FEATURES.showAdvancedCalculators).toBe(true);
    });

    it('should enable audit logs', () => {
      expect(BROKER_FEATURES.showAuditLogs).toBe(true);
    });

    it('should enable export tools', () => {
      expect(BROKER_FEATURES.showExportTools).toBe(true);
    });

    it('should enable branding options', () => {
      expect(BROKER_FEATURES.showBrandingOptions).toBe(true);
    });
  });

  describe('Display Names', () => {
    it('should have display names for all modes', () => {
      const modes: AppMode[] = ['consumer', 'broker'];
      for (const mode of modes) {
        expect(MODE_DISPLAY_NAMES[mode]).toBeDefined();
        expect(typeof MODE_DISPLAY_NAMES[mode]).toBe('string');
      }
    });

    it('should have descriptions for all modes', () => {
      const modes: AppMode[] = ['consumer', 'broker'];
      for (const mode of modes) {
        expect(MODE_DESCRIPTIONS[mode]).toBeDefined();
        expect(typeof MODE_DESCRIPTIONS[mode]).toBe('string');
      }
    });

    it('should have display names for all features', () => {
      const features = Object.keys(CONSUMER_FEATURES) as (keyof ModeFeatures)[];
      for (const feature of features) {
        expect(FEATURE_DISPLAY_NAMES[feature]).toBeDefined();
        expect(typeof FEATURE_DISPLAY_NAMES[feature]).toBe('string');
      }
    });

    it('should have descriptions for all features', () => {
      const features = Object.keys(CONSUMER_FEATURES) as (keyof ModeFeatures)[];
      for (const feature of features) {
        expect(FEATURE_DESCRIPTIONS[feature]).toBeDefined();
        expect(typeof FEATURE_DESCRIPTIONS[feature]).toBe('string');
      }
    });
  });

  describe('Feature Consistency', () => {
    it('should have same feature keys in consumer and broker modes', () => {
      const consumerKeys = Object.keys(CONSUMER_FEATURES).sort();
      const brokerKeys = Object.keys(BROKER_FEATURES).sort();

      expect(consumerKeys).toEqual(brokerKeys);
    });

    it('should have all boolean values', () => {
      for (const value of Object.values(CONSUMER_FEATURES)) {
        expect(typeof value).toBe('boolean');
      }
      for (const value of Object.values(BROKER_FEATURES)) {
        expect(typeof value).toBe('boolean');
      }
    });
  });
});
