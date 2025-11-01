'use client';

import { FormErrors } from '@/types';

interface Step3Props {
  budget: string;
  errors: FormErrors;
  onUpdate: (field: string, value: unknown) => void;
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
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Budget</h2>
        <p className="text-gray-600 text-lg">
          What&apos;s your monthly budget for health insurance?
        </p>
      </div>

      <div className="space-y-3">
        {BUDGET_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onUpdate('budget', option.value)}
            className={`w-full px-6 py-4 rounded-lg font-semibold border-2 text-left transition-all ${
              budget === option.value
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-gray-700 border-gray-300 hover:border-accent'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  budget === option.value
                    ? 'border-white'
                    : 'border-gray-400'
                }`}
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
        <p className="text-red-600 text-sm mt-4">{errors.budget}</p>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>

        <button
          onClick={onSubmit}
          className="px-8 py-3 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary-dark shadow-lg transition-all"
        >
          Analyze Coverage
        </button>
      </div>
    </div>
  );
}
