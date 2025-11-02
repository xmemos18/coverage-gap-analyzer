'use client';

import { FormErrors, UpdateFieldFunction } from '@/types';
import ErrorMessage from '@/components/ErrorMessage';

interface Step3Props {
  budget: string;
  errors: FormErrors;
  onUpdate: UpdateFieldFunction;
  onSubmit: () => void;
  onBack: () => void;
}

const BUDGET_OPTIONS = [
  { value: 'less-500', label: 'Less than $500' },
  { value: '500-1000', label: '$500-$1,000' },
  { value: '1000-2000', label: '$1,000-$2,000' },
  { value: '2000-3500', label: '$2,000-$3,500' },
  { value: '3500-plus', label: '$3,500+' },
  { value: 'not-sure', label: 'Not sure / show all options' },
];

export default function Step3Budget({
  budget,
  errors,
  onUpdate,
  onSubmit,
  onBack,
}: Step3Props) {
  return (
    <div role="form" aria-labelledby="budget-heading">
      <div className="mb-8">
        <h2 id="budget-heading" className="text-3xl font-bold text-gray-900 mb-2">Your Budget</h2>
        <p className="text-gray-600 text-lg">
          What&apos;s your monthly budget for health insurance?
        </p>
      </div>

      <div className="space-y-3" role="radiogroup" aria-labelledby="budget-heading" aria-required="true">
        {BUDGET_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onUpdate('budget', option.value)}
            className={`w-full px-6 py-4 rounded-lg font-semibold border-2 text-left transition-all ${
              budget === option.value
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-gray-700 border-gray-300 hover:border-accent'
            }`}
            role="radio"
            aria-checked={budget === option.value}
            aria-label={`Monthly budget: ${option.label}`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  budget === option.value
                    ? 'border-white'
                    : 'border-gray-400'
                }`}
                aria-hidden="true"
              >
                {budget === option.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
              <span className="text-lg">{option.label}</span>
            </div>
          </button>
        ))}
      </div>

      {errors.budget && (
        <ErrorMessage message={errors.budget} />
      )}

      {/* Navigation */}
      <nav className="flex gap-3 justify-between items-center mt-8 sticky-mobile-nav touch-manipulation" aria-label="Form navigation">
        <button
          onClick={onBack}
          className="px-6 py-3 flex-1 md:flex-initial border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
          aria-label="Go back to current insurance information"
        >
          Back
        </button>

        <button
          onClick={onSubmit}
          className="px-8 py-3 flex-1 md:flex-initial bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary-dark shadow-lg transition-all touch-manipulation"
          aria-label="Analyze coverage and view results"
        >
          Analyze Coverage
        </button>
      </nav>
    </div>
  );
}
