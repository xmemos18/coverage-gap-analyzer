/**
 * Tests for Analytics Integration
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  trackEvent,
  trackPageView,
  trackStepCompleted,
  trackCalculatorCompleted,
  trackResultsAction,
  trackError,
  initializeAnalytics,
} from '../analytics';
import env from '../env';

// Mock env module
jest.mock('../env', () => ({
  __esModule: true,
  default: {
    enableAnalytics: false,
    analyticsId: '',
    enableDebug: false,
    appName: 'Coverage Gap Analyzer',
    appVersion: '1.0.0',
  },
}));

describe('Analytics Integration', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset env mocks
    (env as any).enableAnalytics = false;
    (env as any).analyticsId = '';
    (env as any).enableDebug = false;

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Clear window.gtag and window.plausible
    delete (window as any).gtag;
    delete (window as any).plausible;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('trackEvent', () => {
    it('should not track when analytics is disabled', () => {
      (env as any).enableAnalytics = false;
      (env as any).enableDebug = true;

      trackEvent('calculator_started');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] Event (disabled):',
        'calculator_started',
        undefined
      );
    });

    it('should not track when analytics ID is not configured', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = '';
      (env as any).enableDebug = true;

      trackEvent('calculator_started');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Analytics] No analytics ID configured'
      );
    });

    it('should track event with Google Analytics', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';
      (env as any).enableDebug = true;

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackEvent('calculator_started', { test: 'value' });

      expect(mockGtag).toHaveBeenCalledWith('event', 'calculator_started', {
        test: 'value',
        app_name: 'Coverage Gap Analyzer',
        app_version: '1.0.0',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] GA4 Event:',
        'calculator_started',
        { test: 'value' }
      );
    });

    it('should track event with Plausible', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'example.com';
      (env as any).enableDebug = true;

      const mockPlausible = jest.fn();
      (window as any).plausible = mockPlausible;

      trackEvent('calculator_started', { test: 'value' });

      expect(mockPlausible).toHaveBeenCalledWith('calculator_started', {
        props: { test: 'value' },
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] Plausible Event:',
        'calculator_started',
        { test: 'value' }
      );
    });

    it('should warn when no analytics library is loaded', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';
      (env as any).enableDebug = true;

      trackEvent('calculator_started');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Analytics] No analytics library loaded'
      );
    });

    it('should handle all event types', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';
      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      const events = [
        'calculator_started',
        'step_completed',
        'calculator_completed',
        'results_viewed',
        'results_printed',
        'results_exported',
        'results_shared',
        'error_occurred',
        'resume_data_used',
      ];

      events.forEach((event) => {
        trackEvent(event as any);
      });

      expect(mockGtag).toHaveBeenCalledTimes(events.length);
    });
  });

  describe('trackPageView', () => {
    it('should not track when analytics is disabled', () => {
      (env as any).enableAnalytics = false;

      trackPageView('/test-page');

      // No errors should be thrown
      expect(true).toBe(true);
    });

    it('should track page view with Google Analytics', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackPageView('/test-page', 'Test Page');

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123', {
        page_path: '/test-page',
        page_title: 'Test Page',
      });
    });

    it('should track page view with Plausible', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'example.com';

      const mockPlausible = jest.fn();
      (window as any).plausible = mockPlausible;

      trackPageView('/test-page');

      expect(mockPlausible).toHaveBeenCalledWith('pageview');
    });
  });

  describe('trackStepCompleted', () => {
    it('should track step completion', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackStepCompleted(1, 'Your Residences');

      expect(mockGtag).toHaveBeenCalledWith('event', 'step_completed', {
        step_number: 1,
        step_name: 'Your Residences',
        app_name: 'Coverage Gap Analyzer',
        app_version: '1.0.0',
      });
    });
  });

  describe('trackCalculatorCompleted', () => {
    it('should track calculator completion', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackCalculatorCompleted(2, 2, 1, true);

      expect(mockGtag).toHaveBeenCalledWith('event', 'calculator_completed', {
        num_residences: 2,
        num_adults: 2,
        num_children: 1,
        has_medicare: true,
        app_name: 'Coverage Gap Analyzer',
        app_version: '1.0.0',
      });
    });
  });

  describe('trackResultsAction', () => {
    it('should track print action', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackResultsAction('printed');

      expect(mockGtag).toHaveBeenCalledWith('event', 'results_printed', {
        app_name: 'Coverage Gap Analyzer',
        app_version: '1.0.0',
      });
    });

    it('should track export action', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackResultsAction('exported');

      expect(mockGtag).toHaveBeenCalledWith('event', 'results_exported', {
        app_name: 'Coverage Gap Analyzer',
        app_version: '1.0.0',
      });
    });

    it('should track share action', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackResultsAction('shared');

      expect(mockGtag).toHaveBeenCalledWith('event', 'results_shared', {
        app_name: 'Coverage Gap Analyzer',
        app_version: '1.0.0',
      });
    });
  });

  describe('trackError', () => {
    it('should track error with full details', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackError('validation', 'Invalid ZIP code', 'step1');

      expect(mockGtag).toHaveBeenCalledWith('event', 'error_occurred', {
        error_type: 'validation',
        error_message: 'Invalid ZIP code',
        error_context: 'step1',
        app_name: 'Coverage Gap Analyzer',
        app_version: '1.0.0',
      });
    });

    it('should track error with defaults', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';

      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackError('network');

      expect(mockGtag).toHaveBeenCalledWith('event', 'error_occurred', {
        error_type: 'network',
        error_message: 'unknown',
        error_context: 'unknown',
        app_name: 'Coverage Gap Analyzer',
        app_version: '1.0.0',
      });
    });
  });

  describe('initializeAnalytics', () => {
    it('should log when analytics is disabled', () => {
      (env as any).enableAnalytics = false;
      (env as any).enableDebug = true;

      initializeAnalytics();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] Analytics disabled or no ID configured'
      );
    });

    it('should log when analytics is enabled', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';
      (env as any).enableDebug = true;

      initializeAnalytics();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] Initialized with ID:',
        'G-TEST123'
      );
    });
  });

  describe('Error handling', () => {
    it('should fail silently when gtag throws error', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';
      (env as any).enableDebug = false;

      const mockGtag = jest.fn(() => {
        throw new Error('gtag error');
      });
      (window as any).gtag = mockGtag;

      expect(() => trackEvent('calculator_started')).not.toThrow();
    });

    it('should log error in debug mode', () => {
      (env as any).enableAnalytics = true;
      (env as any).analyticsId = 'G-TEST123';
      (env as any).enableDebug = true;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockGtag = jest.fn(() => {
        throw new Error('gtag error');
      });
      (window as any).gtag = mockGtag;

      trackEvent('calculator_started');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Analytics] Error tracking event:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
