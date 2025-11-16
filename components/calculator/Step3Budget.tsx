'use client';

import { FormErrors, UpdateFieldFunction } from '@/types';
import ErrorMessage from '@/components/ErrorMessage';
import InfoTooltip from '@/components/InfoTooltip';
import { ScaleButton } from '@/components/animations';

interface Step3Props {
  budget: string;
  incomeRange: string;
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

const INCOME_RANGE_OPTIONS = [
  { value: 'under-30k', label: 'Under $30,000' },
  { value: '30k-50k', label: '$30,000 - $50,000' },
  { value: '50k-75k', label: '$50,000 - $75,000' },
  { value: '75k-100k', label: '$75,000 - $100,000' },
  { value: '100k-150k', label: '$100,000 - $150,000' },
  { value: '150k-plus', label: 'Over $150,000' },
  { value: 'prefer-not-say', label: 'Prefer not to say' },
];

export default function Step3Budget({
  budget,
  incomeRange,
  errors,
  onUpdate,
  onSubmit,
  onBack,
}: Step3Props) {
  return (
    <div role="form" aria-labelledby="budget-heading">
      <div className="mb-8">
        <h2 id="budget-heading" className="text-3xl font-bold text-gray-900 mb-2">Your Budget & Income</h2>
        <p className="text-gray-600 text-lg">
          Help us find the best coverage options for your situation.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Monthly Budget
          <InfoTooltip content="Your budget helps us filter plans you can afford. Remember, you'll also have out-of-pocket costs like deductibles, copays, and coinsurance on top of your monthly premium." />
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          What&apos;s your monthly budget for health insurance?
        </p>
        <div className="space-y-3" role="radiogroup" aria-labelledby="budget-heading" aria-required="true">
          {BUDGET_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate('budget', option.value)}
              className={`w-full px-6 py-4 rounded-lg font-semibold border-2 text-left transition-all ${
                budget === option.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
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
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Household Income
          <InfoTooltip content="Income determines eligibility for premium tax credits (subsidies) and Medicaid. Those earning 100-400% of federal poverty level may qualify for substantial savings. This information is private and never shared." />
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          This helps us determine if you qualify for financial assistance through subsidies or Medicaid.
        </p>
        <div className="space-y-3" role="radiogroup" aria-labelledby="budget-heading" aria-required="false">
          {INCOME_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate('incomeRange', option.value)}
              className={`w-full px-6 py-4 rounded-lg font-semibold border-2 text-left transition-all ${
                incomeRange === option.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
              }`}
              role="radio"
              aria-checked={incomeRange === option.value}
              aria-label={`Annual household income: ${option.label}`}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                    incomeRange === option.value
                      ? 'border-white'
                      : 'border-gray-400'
                  }`}
                  aria-hidden="true"
                >
                  {incomeRange === option.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-lg">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
        {errors.incomeRange && (
          <ErrorMessage message={errors.incomeRange} />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex gap-3 justify-between items-center mt-8 sticky-mobile-nav touch-manipulation" aria-label="Form navigation">
        <ScaleButton
          onClick={onBack}
          className="px-6 py-3 flex-1 md:flex-initial border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors touch-manipulation"
          ariaLabel="Go back to current insurance information"
        >
          Back
        </ScaleButton>

        <ScaleButton
          onClick={onSubmit}
          className="px-8 py-3 flex-1 md:flex-initial bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all touch-manipulation"
          ariaLabel="Analyze coverage and view results"
        >
          Analyze Coverage
        </ScaleButton>
      </nav>
    </div>
  );
}
