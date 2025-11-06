'use client';

import { FormErrors, UpdateFieldFunction } from '@/types';
import ErrorMessage from '@/components/ErrorMessage';

interface Step2_3Props {
  hasChronicConditions: boolean;
  chronicConditions: string[];
  prescriptionCount: string;
  providerPreference: string;
  errors: FormErrors;
  onUpdate: UpdateFieldFunction;
  onNext: () => void;
  onBack: () => void;
}

const CHRONIC_CONDITION_OPTIONS = [
  'Diabetes',
  'Heart disease',
  'High blood pressure',
  'Asthma/COPD',
  'Arthritis',
  'Cancer (current or recent)',
  'Other chronic condition',
];

const PRESCRIPTION_COUNT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '1-3', label: '1-3 medications' },
  { value: '4-6', label: '4-6 medications' },
  { value: '7-10', label: '7-10 medications' },
  { value: '10+', label: 'More than 10' },
];

const PROVIDER_PREFERENCE_OPTIONS = [
  { value: 'very-important', label: 'Yes, very important' },
  { value: 'somewhat-important', label: 'Somewhat important' },
  { value: 'no-preference', label: 'No preference' },
];

export default function Step2_3HealthProfile({
  hasChronicConditions,
  chronicConditions,
  prescriptionCount,
  providerPreference,
  errors,
  onUpdate,
  onNext,
  onBack,
}: Step2_3Props) {
  const toggleCondition = (condition: string) => {
    const updatedConditions = chronicConditions.includes(condition)
      ? chronicConditions.filter(c => c !== condition)
      : [...chronicConditions, condition];
    onUpdate('chronicConditions', updatedConditions);
  };

  return (
    <div role="form" aria-labelledby="health-heading">
      <div className="mb-8">
        <h2 id="health-heading" className="text-3xl font-bold text-gray-900 mb-2">Health Information</h2>
        <p className="text-gray-600 text-lg">
          This helps us recommend plans that best fit your healthcare needs.
        </p>
      </div>

      <div className="space-y-8">
        {/* Chronic Conditions */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200" role="group" aria-labelledby="chronic-conditions-heading">
          <h3 id="chronic-conditions-heading" className="text-lg font-semibold text-gray-900 mb-4">
            Does anyone in your household have ongoing medical conditions?
          </h3>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => onUpdate('hasChronicConditions', true)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                hasChronicConditions
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
              }`}
              aria-label="Yes, someone has chronic conditions"
              aria-pressed={hasChronicConditions}
            >
              Yes
            </button>
            <button
              onClick={() => {
                onUpdate('hasChronicConditions', false);
                onUpdate('chronicConditions', []);
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                !hasChronicConditions
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
              }`}
              aria-label="No chronic conditions"
              aria-pressed={!hasChronicConditions}
            >
              No
            </button>
          </div>

          {/* Condition Checkboxes - Show if Yes */}
          {hasChronicConditions && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-3">Select all that apply:</p>
              <div className="space-y-2">
                {CHRONIC_CONDITION_OPTIONS.map((condition) => (
                  <label key={condition} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chronicConditions.includes(condition)}
                      onChange={() => toggleCondition(condition)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-600 rounded"
                      aria-label={condition}
                    />
                    <span className="text-sm text-gray-700">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {errors.chronicConditions && (
            <ErrorMessage message={errors.chronicConditions} />
          )}
        </div>

        {/* Prescription Count */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200" role="group" aria-labelledby="prescription-heading">
          <h3 id="prescription-heading" className="text-lg font-semibold text-gray-900 mb-4">
            How many prescription medications does your household take regularly?
          </h3>
          <div className="space-y-3">
            {PRESCRIPTION_COUNT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdate('prescriptionCount', option.value)}
                className={`w-full px-6 py-3 rounded-lg font-semibold border-2 text-left transition-all ${
                  prescriptionCount === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
                role="radio"
                aria-checked={prescriptionCount === option.value}
                aria-label={`Prescription count: ${option.label}`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      prescriptionCount === option.value
                        ? 'border-white'
                        : 'border-gray-400'
                    }`}
                    aria-hidden="true"
                  >
                    {prescriptionCount === option.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-lg">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
          {errors.prescriptionCount && (
            <ErrorMessage message={errors.prescriptionCount} />
          )}
        </div>

        {/* Provider Preference */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200" role="group" aria-labelledby="provider-heading">
          <h3 id="provider-heading" className="text-lg font-semibold text-gray-900 mb-4">
            Do you have preferred doctors or hospitals you want to keep?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This helps us determine if a PPO (more provider choice) or HMO (lower cost) might be better for you
          </p>
          <div className="space-y-3">
            {PROVIDER_PREFERENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdate('providerPreference', option.value)}
                className={`w-full px-6 py-3 rounded-lg font-semibold border-2 text-left transition-all ${
                  providerPreference === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
                role="radio"
                aria-checked={providerPreference === option.value}
                aria-label={`Provider preference: ${option.label}`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      providerPreference === option.value
                        ? 'border-white'
                        : 'border-gray-400'
                    }`}
                    aria-hidden="true"
                  >
                    {providerPreference === option.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-lg">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
          {errors.providerPreference && (
            <ErrorMessage message={errors.providerPreference} />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-3 justify-between items-center mt-8 sticky-mobile-nav touch-manipulation" aria-label="Form navigation">
        <button
          onClick={onBack}
          className="px-6 py-3 flex-1 md:flex-initial border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
          aria-label="Go back to household information"
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="px-8 py-3 flex-1 md:flex-initial bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-500 shadow-lg transition-all touch-manipulation"
          aria-label="Continue to current insurance information"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
