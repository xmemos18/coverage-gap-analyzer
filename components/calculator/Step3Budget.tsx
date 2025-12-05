'use client';

import { useState, useEffect } from 'react';
import { FormErrors, UpdateFieldFunction } from '@/types';
import ErrorMessage from '@/components/ErrorMessage';
import InfoTooltip from '@/components/InfoTooltip';
import { ScaleButton } from '@/components/animations';
import { parseCurrencyInput, formatCurrencyDisplay } from '@/lib/validation';

interface Step3Props {
  budget: string;
  annualIncome: number | null;
  netWorth: number | null;
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
  annualIncome,
  netWorth,
  errors,
  onUpdate,
  onSubmit,
  onBack,
}: Step3Props) {
  // Local state for input fields (allows user to type freely)
  const [incomeInput, setIncomeInput] = useState(formatCurrencyDisplay(annualIncome));
  const [netWorthInput, setNetWorthInput] = useState(formatCurrencyDisplay(netWorth));
  // Default to NOT checked - user must explicitly choose to skip
  const [preferNotSayIncome, setPreferNotSayIncome] = useState(false);
  const [preferNotSayNetWorth, setPreferNotSayNetWorth] = useState(false);

  // Sync local input when prop changes (e.g., from localStorage restore)
  useEffect(() => {
    if (annualIncome !== null) {
      setIncomeInput(formatCurrencyDisplay(annualIncome));
      setPreferNotSayIncome(false);
    }
  }, [annualIncome]);

  useEffect(() => {
    if (netWorth !== null) {
      setNetWorthInput(formatCurrencyDisplay(netWorth));
      setPreferNotSayNetWorth(false);
    }
  }, [netWorth]);

  const handleIncomeChange = (value: string) => {
    setIncomeInput(value);
    const parsed = parseCurrencyInput(value);
    onUpdate('annualIncome', parsed);
  };

  const handleIncomeBlur = () => {
    // Format on blur for better display
    if (annualIncome !== null) {
      setIncomeInput(formatCurrencyDisplay(annualIncome));
    }
  };

  const handleNetWorthChange = (value: string) => {
    setNetWorthInput(value);
    const parsed = parseCurrencyInput(value);
    onUpdate('netWorth', parsed);
  };

  const handleNetWorthBlur = () => {
    // Format on blur for better display
    if (netWorth !== null) {
      setNetWorthInput(formatCurrencyDisplay(netWorth));
    }
  };

  const handlePreferNotSayIncome = (checked: boolean) => {
    setPreferNotSayIncome(checked);
    if (checked) {
      setIncomeInput('');
      onUpdate('annualIncome', null);
    }
  };

  const handlePreferNotSayNetWorth = (checked: boolean) => {
    setPreferNotSayNetWorth(checked);
    if (checked) {
      setNetWorthInput('');
      onUpdate('netWorth', null);
    }
  };
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
          Annual Household Income
          <InfoTooltip content="Your exact income allows us to calculate precise subsidy eligibility. Those earning 100-400% of federal poverty level may qualify for substantial savings. This information is private and never shared." />
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          This helps us determine if you qualify for financial assistance through subsidies or Medicaid.
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="annual-income" className="sr-only">Annual household income</label>
            <input
              id="annual-income"
              type="text"
              inputMode="decimal"
              value={incomeInput}
              onChange={(e) => handleIncomeChange(e.target.value)}
              onBlur={handleIncomeBlur}
              disabled={preferNotSayIncome}
              placeholder="e.g., $75,000 or $1.5M"
              className={`w-full px-6 py-4 rounded-lg font-semibold border-2 text-left transition-all text-lg ${
                preferNotSayIncome
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
              }`}
              aria-describedby="income-hint"
            />
            <p id="income-hint" className="text-gray-500 text-sm mt-2">
              Enter your total household income before taxes. Supports formats: $75,000, 75k, 1.5M, 2B
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferNotSayIncome}
              onChange={(e) => handlePreferNotSayIncome(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-600">Prefer not to say</span>
          </label>
        </div>
        {errors.annualIncome && (
          <ErrorMessage message={errors.annualIncome} />
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Total Net Worth
          <InfoTooltip content="Your net worth helps us recommend appropriate deductible levels. Higher net worth may support higher-deductible plans (like HDHPs with HSAs) that offer lower premiums and tax advantages." />
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          This helps us recommend plans with appropriate out-of-pocket costs for your financial situation.
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="net-worth" className="sr-only">Total net worth</label>
            <input
              id="net-worth"
              type="text"
              inputMode="decimal"
              value={netWorthInput}
              onChange={(e) => handleNetWorthChange(e.target.value)}
              onBlur={handleNetWorthBlur}
              disabled={preferNotSayNetWorth}
              placeholder="e.g., $500,000 or $2.5M"
              className={`w-full px-6 py-4 rounded-lg font-semibold border-2 text-left transition-all text-lg ${
                preferNotSayNetWorth
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
              }`}
              aria-describedby="net-worth-hint"
            />
            <p id="net-worth-hint" className="text-gray-500 text-sm mt-2">
              Assets minus debts. Can be negative if in debt. Supports: $500k, 2.5M, 1B
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferNotSayNetWorth}
              onChange={(e) => handlePreferNotSayNetWorth(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-600">Prefer not to say</span>
          </label>
        </div>
        {errors.netWorth && (
          <ErrorMessage message={errors.netWorth} />
        )}
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
