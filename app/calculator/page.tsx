'use client';

import { useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalculatorFormData, FormErrors } from '@/types';
import Step1Residences from '@/components/calculator/Step1Residences';
import Step2Household from '@/components/calculator/Step2Household';
import Step2_5CurrentInsurance from '@/components/calculator/Step2_5CurrentInsurance';
import Step3Budget from '@/components/calculator/Step3Budget';
import MobileProgressBar from '@/components/MobileProgressBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { loadCalculatorData, saveCalculatorData, clearCalculatorData, isDataRecent } from '@/lib/localStorage';
import { calculatorReducer, createInitialState } from '@/lib/calculatorReducer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardNavigation';
import { useFocusOnError, useStepFocus, useLiveRegionAnnouncement, useFocusVisible } from '@/hooks/useFocusManagement';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { VALIDATION, THRESHOLDS, STORAGE_KEYS, STEP_NAMES, CALCULATOR_STEPS } from '@/lib/constants';

const INITIAL_FORM_DATA: CalculatorFormData = {
  // New array-based residences (minimum 2 required)
  residences: [
    { zip: '', state: '' }, // Primary
    { zip: '', state: '' }, // Secondary
  ],
  // Legacy fields for backward compatibility
  primaryResidence: { zip: '', state: '' },
  secondaryResidence: { zip: '', state: '' },
  hasThirdHome: false,
  thirdResidence: { zip: '', state: '' },
  numAdults: 0,
  adultAges: [],
  numChildren: 0,
  childAges: [],
  hasMedicareEligible: false,
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
  currentStep: CALCULATOR_STEPS.RESIDENCES,
};

export default function Calculator() {
  const router = useRouter();
  const [state, dispatch] = useReducer(calculatorReducer, createInitialState(INITIAL_FORM_DATA));

  const { formData, errors, isLoading, showResumePrompt } = state;

  // Focus management hooks
  const stepContainerRef = useStepFocus(formData.currentStep);
  const { liveRegionRef, announce } = useLiveRegionAnnouncement();
  useFocusOnError(errors);
  useFocusVisible();

  // Announce step changes to screen readers
  useEffect(() => {
    announce(`Step ${formData.currentStep} of ${CALCULATOR_STEPS.TOTAL_STEPS}: ${STEP_NAMES[formData.currentStep - 1]}`);
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
    const result = loadCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);

    if (result.success && result.data) {
      // Check if data is recent
      if (isDataRecent(result.data, THRESHOLDS.DATA_EXPIRY_HOURS)) {
        dispatch({ type: 'SET_RESUME_PROMPT', show: true });
      } else {
        // Data is too old, clear it
        const clearResult = clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
        if (!clearResult.success) {
          console.error('Failed to clear old data:', clearResult.error);
        }
      }
    } else if (result.error) {
      // Invalid or corrupted data - log and clear
      console.error('Failed to load saved calculator data:', result.error);
      const clearResult = clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
      if (!clearResult.success) {
        console.error('Failed to clear corrupted data:', clearResult.error);
      }
    }
  }, []);

  // Debounced save to localStorage
  const saveToLocalStorage = useDebouncedCallback(() => {
    const hasData = formData.currentStep > CALCULATOR_STEPS.RESIDENCES ||
                    formData.residences.some(r => r.zip || r.state) ||
                    formData.numAdults > 0;

    if (hasData) {
      const result = saveCalculatorData(STORAGE_KEYS.CALCULATOR_DATA, formData, true);
      if (!result.success) {
        // Failed to save to localStorage (quota exceeded, private mode, etc.)
        console.error('Failed to save calculator data:', result.error);
        // Continue without saving - form will still work, just won't persist
      }
    }
  }, THRESHOLDS.DEBOUNCE_DELAY_MS);

  // Trigger save whenever form changes
  useEffect(() => {
    saveToLocalStorage();
  }, [formData, saveToLocalStorage]);

  const resumeSavedData = () => {
    const result = loadCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);

    if (result.success && result.data) {
      // Remove timestamp before setting form data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timestamp, ...formDataWithoutTimestamp } = result.data;
      dispatch({ type: 'SET_FORM_DATA', data: formDataWithoutTimestamp });
    } else {
      // Failed to load or validate data
      console.error('Failed to resume saved calculator data:', result.error);
      // Clear corrupted data and reset form
      const clearResult = clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
      if (!clearResult.success) {
        console.error('Failed to clear corrupted data:', clearResult.error);
      }
      // Reset to initial state
      dispatch({ type: 'RESET_FORM', initialData: INITIAL_FORM_DATA });
    }

    dispatch({ type: 'SET_RESUME_PROMPT', show: false });
  };

  const clearSavedData = () => {
    const result = clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
    if (!result.success) {
      console.error('Failed to clear saved calculator data:', result.error);
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

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate all residences in the array
    formData.residences.forEach((residence, index) => {
      // Validate ZIP code
      if (!residence.zip || residence.zip.length !== VALIDATION.ZIP_CODE_LENGTH) {
        newErrors[`residence${index}Zip`] = `Please enter a valid ${VALIDATION.ZIP_CODE_LENGTH}-digit ZIP code`;
      }
      // Validate state
      if (!residence.state) {
        newErrors[`residence${index}State`] = 'Please select a state';
      }
    });

    // Ensure minimum residences
    if (formData.residences.length < VALIDATION.MIN_RESIDENCES) {
      newErrors.residences = `You must have at least ${VALIDATION.MIN_RESIDENCES} residences`;
    }

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.numAdults === 0) {
      newErrors.numAdults = 'Please select the number of adults';
    }

    // Validate adult ages
    formData.adultAges.forEach((age, index) => {
      if (!age || age < 18 || age > 100) {
        newErrors[`adultAge${index}`] = 'Please enter a valid age (18-100)';
      }
    });

    // Validate child ages
    formData.childAges.forEach((age, index) => {
      if (age < 0 || age > 17) {
        newErrors[`childAge${index}`] = 'Please enter a valid age (0-17)';
      }
    });

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};

    // Only validate if user said they have current insurance
    if (formData.hasCurrentInsurance) {
      if (!formData.currentInsurance.carrier.trim()) {
        newErrors.carrier = 'Please enter your insurance carrier';
      }
      if (!formData.currentInsurance.planType) {
        newErrors.planType = 'Please select your plan type';
      }
      if (!formData.currentInsurance.monthlyCost || formData.currentInsurance.monthlyCost < 0) {
        newErrors.monthlyCost = 'Please enter a valid monthly cost';
      }
    }

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.budget) {
      newErrors.budget = 'Please select a budget range';
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
    }

    if (isValid) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleSubmit = async () => {
    if (!validateStep4()) {
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

      // Add budget
      params.append('budget', formData.budget);

      // Clear saved data on successful submission
      const clearResult = clearCalculatorData(STORAGE_KEYS.CALCULATOR_DATA);
      if (!clearResult.success) {
        console.error('Failed to clear saved data:', clearResult.error);
        // Continue anyway - this is not critical
      }

      router.push(`/results?${params.toString()}`);
    } catch (error) {
      console.error('Error submitting calculator form:', error);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      // Could set an error state here to show user feedback
      // For now, just stop the loading spinner so user can try again
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
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Coverage Calculator</h1>
          <p className="text-gray-600 text-base md:text-lg">Answer 4 quick questions to find your ideal insurance</p>
        </div>

        {/* Resume Prompt */}
        {showResumePrompt && (
          <div className="bg-blue-50 border-2 border-accent rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Continue where you left off?
            </h2>
            <p className="text-gray-700 mb-4">
              We found your previous progress. Would you like to resume?
            </p>
            <div className="flex gap-3">
              <button
                onClick={resumeSavedData}
                className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-light transition-colors"
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
              const isPending = formData.currentStep < step;

              return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      isCurrent
                        ? 'bg-accent text-white scale-110 ring-2 ring-accent ring-offset-2'
                        : isCompleted
                        ? 'bg-success text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                    aria-label={`Step ${step}: ${STEP_NAMES[step - 1]}${isCompleted ? ' - Completed' : isCurrent ? ' - Current' : ' - Pending'}`}
                  >
                    {isCompleted ? <span aria-hidden="true">✓</span> : <span aria-hidden="true">{step}</span>}
                    <span className="sr-only">{isCompleted ? 'Completed' : isCurrent ? 'Current step' : `Step ${step}`}</span>
                  </div>
                  <div className={`text-xs font-semibold mt-2 ${
                    isCurrent ? 'text-accent font-bold' : 'text-gray-600'
                  }`}>
                    {STEP_NAMES[step - 1]}
                  </div>
                </div>
                {step < CALCULATOR_STEPS.TOTAL_STEPS && (
                  <div
                    className={`w-20 h-1 mb-6 transition-all ${
                      isCompleted ? 'bg-success' : 'bg-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
            })}
          </div>
          <p className="text-center text-gray-600 font-medium">
            Step {formData.currentStep} of {CALCULATOR_STEPS.TOTAL_STEPS}: {STEP_NAMES[formData.currentStep - 1]}
          </p>

          {/* Clear Button */}
          {(formData.currentStep > CALCULATOR_STEPS.RESIDENCES || formData.residences.some(r => r.zip || r.state)) && (
            <div className="text-center mt-4">
              <button
                onClick={clearSavedData}
                className="text-sm text-gray-500 hover:text-accent underline"
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
                <summary className="cursor-pointer hover:text-accent">
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
                className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-light transition-colors"
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
                errors={errors}
                onUpdate={updateField}
                onSubmit={handleSubmit}
                onBack={handleBack}
              />
            )}
          </div>
        </ErrorBoundary>
      </div>

      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Analyzing Your Coverage...
            </h3>
            <p className="text-gray-600">
              Finding the best insurance options for your situation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
