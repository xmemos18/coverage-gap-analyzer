'use client';

import { useReducer, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CalculatorFormData, FormErrors } from '@/types';
import Step1Residences from '@/components/calculator/Step1Residences';
import Step2Household from '@/components/calculator/Step2Household';
import Step2_3HealthProfile from '@/components/calculator/Step2_3HealthProfile';
import Step2_5CurrentInsurance from '@/components/calculator/Step2_5CurrentInsurance';
import Step3Budget from '@/components/calculator/Step3Budget';
import MobileProgressBar from '@/components/MobileProgressBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoadingOverlay from '@/components/LoadingOverlay';
import { loadCalculatorData, saveCalculatorData, clearCalculatorData, isDataRecent } from '@/lib/localStorage';
import { calculatorReducer, createInitialState } from '@/lib/calculatorReducer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardNavigation';
import { useFocusOnError, useStepFocus, useLiveRegionAnnouncement, useFocusVisible } from '@/hooks/useFocusManagement';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { VALIDATION, THRESHOLDS, STORAGE_KEYS, CALCULATOR_STEPS, getStepName } from '@/lib/constants';
import SimpleModeToggle from '@/components/SimpleModeToggle';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';
import { trackEvent, trackStepCompleted } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/useToast';
import {
  validateZipCodeWithMessage,
  validateStateWithMessage,
  validateNumAdultsWithMessage,
  validateAdultAgeWithMessage,
  validateChildAgeWithMessage,
  validateCarrierWithMessage,
  validatePlanTypeWithMessage,
  validateMonthlyCostWithMessage,
  validateBudgetWithMessage,
} from '@/lib/validationMessages';

const INITIAL_FORM_DATA: CalculatorFormData = {
  // Array-based residences (minimum 1 required)
  residences: [
    { zip: '', state: '', isPrimary: true, monthsPerYear: 0 }, // Primary
  ],
  numAdults: 0,
  adultAges: [],
  numChildren: 0,
  childAges: [],
  hasMedicareEligible: false,
  hasEmployerInsurance: false,
  employerContribution: 0,
  hasChronicConditions: false,
  chronicConditions: [],
  prescriptionCount: '',
  providerPreference: '',
  hasCurrentInsurance: false,
  currentInsurance: {
    carrier: '',
    planType: '',
    monthlyCost: 0,
    deductible: 0,
    outOfPocketMax: 0,
    coverageNotes: '',
  },
  budget: '',
  incomeRange: '',
  currentStep: CALCULATOR_STEPS.RESIDENCES,
  simpleMode: false, // Default to advanced mode
  interestedInAddOns: true, // Default to showing add-on recommendations
};

export default function Calculator() {
  const router = useRouter();
  const [state, dispatch] = useReducer(calculatorReducer, createInitialState(INITIAL_FORM_DATA));
  const hasTrackedStart = useRef(false);
  const { showSuccess, showError } = useToast();

  const { formData, errors, isLoading, showResumePrompt } = state;

  // Focus management hooks
  const stepContainerRef = useStepFocus(formData.currentStep);
  const { liveRegionRef, announce } = useLiveRegionAnnouncement();
  useFocusOnError(errors);
  useFocusVisible();

  // Track calculator start (once)
  useEffect(() => {
    if (!hasTrackedStart.current && !showResumePrompt) {
      trackEvent('calculator_started');
      hasTrackedStart.current = true;
    }
  }, [showResumePrompt]);

  // Announce step changes to screen readers
  useEffect(() => {
    announce(`Step ${formData.currentStep} of ${CALCULATOR_STEPS.TOTAL_STEPS}: ${getStepName(formData.currentStep)}`);
  }, [formData.currentStep, announce]);

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts({
    'alt+n': () => {
      if (formData.currentStep < CALCULATOR_STEPS.TOTAL_STEPS && !isLoading) {
        handleNext();
      }
    },
    'alt+b': () => {
      if (formData.currentStep > CALCULATOR_STEPS.RESIDENCES && !isLoading) {
        handleBack();
      }
    },
    'alt+s': () => {
      if (formData.currentStep === CALCULATOR_STEPS.BUDGET && !isLoading) {
        handleSubmit();
      }
    },
    'alt+c': () => {
      if (!isLoading) {
        clearSavedData();
      }
    },
  }, !showResumePrompt && !isLoading);

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      const result = await loadCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);

      if (result.success && result.data) {
        // Check if data is recent
        if (isDataRecent(result.data, THRESHOLDS.DATA_EXPIRY_HOURS)) {
          dispatch({ type: 'SET_RESUME_PROMPT', show: true });
          showSuccess('Progress restored from previous session');
        } else {
          // Data is too old, clear it
          const clearResult = await clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
          if (!clearResult.success) {
            logger.error('Failed to clear old data', clearResult.error);
          }
        }
      } else if (result.error) {
        // Invalid or corrupted data - log and clear
        logger.error('Failed to load saved calculator data', result.error);
        const clearResult = await clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
        if (!clearResult.success) {
          logger.error('Failed to clear corrupted data', clearResult.error);
        }
      }
    };

    loadData().catch(err => {
      logger.error('Error loading calculator data on mount', err);
    });
  }, [showSuccess, showError]);

  // Debounced save to localStorage (now async)
  const saveToLocalStorage = useDebouncedCallback(async () => {
    const hasData = formData.currentStep > CALCULATOR_STEPS.RESIDENCES ||
                    formData.residences.some(r => r.zip || r.state) ||
                    formData.numAdults > 0;

    if (hasData) {
      const result = await saveCalculatorData(STORAGE_KEYS.CALCULATOR_DATA, formData, true);
      if (!result.success) {
        // Failed to save to localStorage (quota exceeded, private mode, etc.)
        logger.error('Failed to save calculator data', result.error);
        // Continue without saving - form will still work, just won't persist
      }
    }
  }, THRESHOLDS.DEBOUNCE_DELAY_MS);

  // Trigger save whenever form changes
  useEffect(() => {
    void saveToLocalStorage();
  }, [formData, saveToLocalStorage]);

  const resumeSavedData = async () => {
    const result = await loadCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);

    if (result.success && result.data) {
      // Remove timestamp before setting form data (if it exists)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timestamp: _timestamp, ...formDataWithoutTimestamp } = result.data;
      dispatch({ type: 'SET_FORM_DATA', data: formDataWithoutTimestamp });

      // Track resume action
      trackEvent('resume_data_used', {
        step: formDataWithoutTimestamp.currentStep,
        step_name: getStepName(formDataWithoutTimestamp.currentStep),
      });
    } else {
      // Failed to load or validate data
      logger.error('Failed to resume saved calculator data', result.error);
      // Clear corrupted data and reset form
      const clearResult = await clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
      if (!clearResult.success) {
        logger.error('Failed to clear corrupted data', clearResult.error);
      }
      // Reset to initial state
      dispatch({ type: 'RESET_FORM', initialData: INITIAL_FORM_DATA });
    }

    dispatch({ type: 'SET_RESUME_PROMPT', show: false });
  };

  const clearSavedData = async () => {
    const result = await clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
    if (!result.success) {
      logger.error('Failed to clear saved calculator data', result.error);
      // Continue - we'll still reset the form state
    }
    dispatch({ type: 'RESET_FORM', initialData: INITIAL_FORM_DATA });
  };

  const updateField = <K extends keyof CalculatorFormData>(
    field: K,
    value: CalculatorFormData[K]
  ) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const handleModeToggle = (newMode: boolean) => {
    // Set reasonable defaults for simple mode
    if (newMode) {
      // Simple mode: Set defaults for skipped fields
      dispatch({ type: 'SET_FIELD', field: 'hasEmployerInsurance', value: false });
      dispatch({ type: 'SET_FIELD', field: 'employerContribution', value: 0 });
      dispatch({ type: 'SET_FIELD', field: 'hasChronicConditions', value: false });
      dispatch({ type: 'SET_FIELD', field: 'chronicConditions', value: [] });
      dispatch({ type: 'SET_FIELD', field: 'prescriptionCount', value: '' });
      dispatch({ type: 'SET_FIELD', field: 'providerPreference', value: '' });
      dispatch({ type: 'SET_FIELD', field: 'hasCurrentInsurance', value: false });
    }

    dispatch({ type: 'SET_FIELD', field: 'simpleMode', value: newMode });

    // Track mode change
    trackEvent('mode_toggled', { mode: newMode ? 'simple' : 'advanced' });
  };

  const hasFormData = formData.currentStep > CALCULATOR_STEPS.RESIDENCES ||
                      formData.residences.some(r => r.zip || r.state) ||
                      formData.numAdults > 0;

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate all residences in the array
    formData.residences.forEach((residence, index) => {
      // Validate ZIP code
      const zipValidation = validateZipCodeWithMessage(residence.zip);
      if (!zipValidation.isValid) {
        newErrors[`residence${index}Zip`] = zipValidation.error || 'Invalid ZIP code';
      }

      // Validate state
      const stateValidation = validateStateWithMessage(residence.state);
      if (!stateValidation.isValid) {
        newErrors[`residence${index}State`] = stateValidation.error || 'Please select a state';
      }
    });

    // Ensure minimum residences
    if (formData.residences.length < VALIDATION.MIN_RESIDENCES) {
      newErrors.residences = `You must have at least ${VALIDATION.MIN_RESIDENCES} residence${VALIDATION.MIN_RESIDENCES > 1 ? 's' : ''}`;
    }

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate number of adults
    const numAdultsValidation = validateNumAdultsWithMessage(formData.numAdults);
    if (!numAdultsValidation.isValid) {
      newErrors.numAdults = numAdultsValidation.error || 'Please select the number of adults';
    }

    // Validate adult ages
    formData.adultAges.forEach((age, index) => {
      const ageValidation = validateAdultAgeWithMessage(age);
      if (!ageValidation.isValid) {
        newErrors[`adultAge${index}`] = ageValidation.error || 'Invalid age';
      }
    });

    // Validate child ages
    formData.childAges.forEach((age, index) => {
      const ageValidation = validateChildAgeWithMessage(age);
      if (!ageValidation.isValid) {
        newErrors[`childAge${index}`] = ageValidation.error || 'Invalid age';
      }
    });

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};

    // If user selected "Yes" to chronic conditions, they must select at least one
    if (formData.hasChronicConditions && formData.chronicConditions.length === 0) {
      newErrors.chronicConditions = 'Please select at least one condition or choose "No"';
    }

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: FormErrors = {};

    // Only validate if user said they have current insurance
    if (formData.hasCurrentInsurance) {
      const carrierValidation = validateCarrierWithMessage(formData.currentInsurance.carrier);
      if (!carrierValidation.isValid) {
        newErrors.carrier = carrierValidation.error || 'Please enter your insurance carrier';
      }

      const planTypeValidation = validatePlanTypeWithMessage(formData.currentInsurance.planType);
      if (!planTypeValidation.isValid) {
        newErrors.planType = planTypeValidation.error || 'Please select your plan type';
      }

      const costValidation = validateMonthlyCostWithMessage(formData.currentInsurance.monthlyCost);
      if (!costValidation.isValid) {
        newErrors.monthlyCost = costValidation.error || 'Please enter a valid monthly cost';
      }
    }

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = (): boolean => {
    const newErrors: FormErrors = {};

    const budgetValidation = validateBudgetWithMessage(formData.budget);
    if (!budgetValidation.isValid) {
      newErrors.budget = budgetValidation.error || 'Please select a budget range';
    }

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    switch (formData.currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      case 5:
        isValid = validateStep5();
        break;
    }

    if (isValid) {
      // Track step completion before advancing
      trackStepCompleted(formData.currentStep, getStepName(formData.currentStep));
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleSubmit = async () => {
    // Prevent multi-submit - check if already loading
    if (isLoading) {
      logger.warn('Form submission already in progress, ignoring duplicate submit');
      return;
    }

    if (!validateStep5()) {
      return;
    }

    // Show loading spinner
    dispatch({ type: 'SET_LOADING', isLoading: true });

    try {
      // Simulate analysis delay for better UX
      await new Promise(resolve => setTimeout(resolve, THRESHOLDS.ANALYSIS_DELAY_MS));

      // Build URL parameters
      const params = new URLSearchParams();

      // Add residences as comma-separated zips and states
      const residenceZips = formData.residences.map(r => r.zip).join(',');
      const residenceStates = formData.residences.map(r => r.state).join(',');
      params.append('residenceZips', residenceZips);
      params.append('residenceStates', residenceStates);

      // Add household info
      params.append('numAdults', formData.numAdults.toString());
      params.append('adultAges', formData.adultAges.join(','));
      params.append('numChildren', formData.numChildren.toString());
      if (formData.numChildren > 0) {
        params.append('childAges', formData.childAges.join(','));
      }
      params.append('hasMedicareEligible', formData.hasMedicareEligible.toString());

      // Add employment & coverage info
      params.append('hasEmployerInsurance', formData.hasEmployerInsurance.toString());
      if (formData.hasEmployerInsurance && formData.employerContribution > 0) {
        params.append('employerContribution', formData.employerContribution.toString());
      }

      // Add health profile info
      params.append('hasChronicConditions', formData.hasChronicConditions.toString());
      if (formData.hasChronicConditions && formData.chronicConditions.length > 0) {
        params.append('chronicConditions', formData.chronicConditions.join(','));
      }
      if (formData.prescriptionCount) {
        params.append('prescriptionCount', formData.prescriptionCount);
      }
      if (formData.providerPreference) {
        params.append('providerPreference', formData.providerPreference);
      }

      // Add current insurance if provided
      params.append('hasCurrentInsurance', formData.hasCurrentInsurance.toString());
      if (formData.hasCurrentInsurance) {
        params.append('currentCarrier', formData.currentInsurance.carrier);
        params.append('currentPlanType', formData.currentInsurance.planType);
        params.append('currentMonthlyCost', formData.currentInsurance.monthlyCost.toString());
        params.append('currentDeductible', formData.currentInsurance.deductible.toString());
        params.append('currentOutOfPocketMax', formData.currentInsurance.outOfPocketMax.toString());
        params.append('currentCoverageNotes', formData.currentInsurance.coverageNotes);
      }

      // Add budget and income
      params.append('budget', formData.budget);
      if (formData.incomeRange) {
        params.append('incomeRange', formData.incomeRange);
      }

      // Add UI mode
      params.append('simpleMode', formData.simpleMode.toString());

      // Clear saved data on successful submission
      const clearResult = await clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
      if (!clearResult.success) {
        logger.error('Failed to clear saved data', clearResult.error);
        // Continue anyway - this is not critical
      }

      router.push(`/results?${params.toString()}`);
    } catch (error) {
      logger.error('Error submitting calculator form', error);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      showError('Failed to submit form. Please try again or contact support if the issue persists.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white md:py-12 pb-32 md:pb-12 px-4">
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Mobile-only progress bar */}
      {!showResumePrompt && <MobileProgressBar currentStep={formData.currentStep} />}

      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8 mt-4 md:mt-0">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">Coverage Calculator</h1>
          <p className="text-gray-600 text-base md:text-lg">
            {formData.simpleMode
              ? "Answer 3 quick questions to find your ideal insurance"
              : "Answer detailed questions for personalized recommendations"}
          </p>
        </div>

        {/* Simple Mode Toggle */}
        {!showResumePrompt && (
          <SimpleModeToggle
            simpleMode={formData.simpleMode}
            onToggle={handleModeToggle}
            hasFormData={hasFormData}
          />
        )}

        {/* Resume Prompt */}
        {showResumePrompt && (
          <div className="bg-blue-50 border-2 border-blue-600 rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Continue where you left off?
            </h2>
            <p className="text-gray-700 mb-4">
              We found your previous progress. Would you like to resume?
            </p>
            <div className="flex gap-3">
              <button
                onClick={resumeSavedData}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={clearSavedData}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Desktop Progress Indicator - hidden on mobile */}
        <div className="mb-8 hidden md:block">
          <div className="flex items-center justify-center gap-0 mb-6">
            {[...Array(CALCULATOR_STEPS.TOTAL_STEPS)].map((_, index) => {
              const step = index + 1;
              const isCompleted = formData.currentStep > step;
              const isCurrent = formData.currentStep === step;

              return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white scale-110 ring-2 ring-blue-600 ring-offset-2'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                    aria-label={`Step ${step}: ${getStepName(step)}${isCompleted ? ' - Completed' : isCurrent ? ' - Current' : ' - Pending'}`}
                  >
                    {isCompleted ? <span aria-hidden="true">✓</span> : <span aria-hidden="true">{step}</span>}
                    <span className="sr-only">{isCompleted ? 'Completed' : isCurrent ? 'Current step' : `Step ${step}`}</span>
                  </div>
                  <div className={`text-xs font-semibold mt-2 ${
                    isCurrent ? 'text-blue-600 font-bold' : 'text-gray-600'
                  }`}>
                    {getStepName(step)}
                  </div>
                </div>
                {step < CALCULATOR_STEPS.TOTAL_STEPS && (
                  <div
                    className={`w-20 h-1 mb-6 transition-all ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
            })}
          </div>
          <p className="text-center text-gray-600 font-medium">
            Step {formData.currentStep} of {CALCULATOR_STEPS.TOTAL_STEPS}: {getStepName(formData.currentStep)}
          </p>

          {/* Clear Button */}
          {(formData.currentStep > CALCULATOR_STEPS.RESIDENCES || formData.residences.some(r => r.zip || r.state)) && (
            <div className="text-center mt-4">
              <button
                onClick={clearSavedData}
                className="text-sm text-gray-500 hover:text-blue-600 underline"
                aria-label="Clear form and start over"
              >
                Clear and start over
              </button>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          {!showResumePrompt && (
            <div className="text-center mt-4">
              <details className="inline-block text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-blue-600">
                  ⌨️ Keyboard shortcuts
                </summary>
                <div className="mt-2 text-left bg-gray-50 rounded-lg p-3 shadow-sm">
                  <ul className="space-y-1">
                    {formData.currentStep < CALCULATOR_STEPS.TOTAL_STEPS && (
                      <li><kbd className="px-2 py-1 bg-white rounded border">Alt+N</kbd> Next step</li>
                    )}
                    {formData.currentStep > CALCULATOR_STEPS.RESIDENCES && (
                      <li><kbd className="px-2 py-1 bg-white rounded border">Alt+B</kbd> Back step</li>
                    )}
                    {formData.currentStep === CALCULATOR_STEPS.BUDGET && (
                      <li><kbd className="px-2 py-1 bg-white rounded border">Alt+S</kbd> Submit</li>
                    )}
                    <li><kbd className="px-2 py-1 bg-white rounded border">Alt+C</kbd> Clear form</li>
                  </ul>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Form Container */}
        <ErrorBoundary
          fallback={
            <div className="bg-white rounded-xl shadow-xl p-8 text-center">
              <p className="text-red-600 text-lg font-semibold mb-4">
                There was an error loading the form.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
              >
                Reload Calculator
              </button>
            </div>
          }
        >
          <div
            ref={stepContainerRef}
            className="bg-white rounded-xl shadow-xl p-8"
            tabIndex={-1}
            role="region"
            aria-label={`Step ${formData.currentStep} of ${CALCULATOR_STEPS.TOTAL_STEPS}: ${getStepName(formData.currentStep)}`}
          >
            {formData.currentStep === CALCULATOR_STEPS.RESIDENCES && (
              <Step1Residences
                residences={formData.residences}
                errors={errors}
                onUpdate={updateField}
                onNext={handleNext}
              />
            )}

            {formData.currentStep === CALCULATOR_STEPS.HOUSEHOLD && (
              <Step2Household
                numAdults={formData.numAdults}
                adultAges={formData.adultAges}
                numChildren={formData.numChildren}
                childAges={formData.childAges}
                hasMedicareEligible={formData.hasMedicareEligible}
                hasEmployerInsurance={formData.hasEmployerInsurance}
                employerContribution={formData.employerContribution}
                errors={errors}
                onUpdate={updateField}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {formData.currentStep === CALCULATOR_STEPS.HEALTH_PROFILE && (
              <Step2_3HealthProfile
                hasChronicConditions={formData.hasChronicConditions}
                chronicConditions={formData.chronicConditions}
                prescriptionCount={formData.prescriptionCount}
                providerPreference={formData.providerPreference}
                errors={errors}
                onUpdate={updateField}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {formData.currentStep === CALCULATOR_STEPS.CURRENT_INSURANCE && (
              <Step2_5CurrentInsurance
                hasCurrentInsurance={formData.hasCurrentInsurance}
                currentInsurance={formData.currentInsurance}
                errors={errors}
                onUpdate={updateField}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {formData.currentStep === CALCULATOR_STEPS.BUDGET && (
              <Step3Budget
                budget={formData.budget}
                incomeRange={formData.incomeRange}
                errors={errors}
                onUpdate={updateField}
                onSubmit={handleSubmit}
                onBack={handleBack}
              />
            )}
          </div>
        </ErrorBoundary>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isLoading}
        title="Analyzing Your Coverage..."
        message="Finding the best insurance options for your situation"
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />
    </div>
  );
}
