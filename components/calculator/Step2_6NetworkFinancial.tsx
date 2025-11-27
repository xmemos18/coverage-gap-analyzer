'use client';

import { CalculatorFormData, UpdateFieldFunction, SelectablePlanTypeValue } from '@/types';
import { SELECTABLE_PLAN_TYPES } from '@/lib/constants';

interface Step2_6Props {
  formData: CalculatorFormData;
  updateField: UpdateFieldFunction;
  errors: { [key: string]: string };
}

export default function Step2_6NetworkFinancial({
  formData,
  updateField,
  errors,
}: Step2_6Props) {
  // Check if user has Medicare-eligible adults (65+) - null safe
  const hasMedicareEligible = (formData.adultAges ?? []).some(age => age >= 65);

  // Filter plan types based on eligibility
  const availablePlanTypes = SELECTABLE_PLAN_TYPES.filter(planType => {
    // Medicare options only shown if there are Medicare-eligible adults
    if (planType.value === 'Medicare Advantage' || planType.value === 'Medigap') {
      return hasMedicareEligible;
    }
    return true;
  });

  const togglePlanType = (value: SelectablePlanTypeValue) => {
    const current = formData.preferredPlanTypes || [];
    if (current.includes(value)) {
      updateField('preferredPlanTypes', current.filter(t => t !== value));
    } else {
      updateField('preferredPlanTypes', [...current, value]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Network & Financial Preferences</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your priorities help us find the perfect balance between cost and coverage.
        </p>
      </div>

      {/* Network Preferences Section */}
      <div className="border-b border-gray-200 dark:border-dark-600 pb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <span className="text-2xl" role="img" aria-label="Hospital">🏥</span>
          Healthcare Network Preferences
        </h3>

        {/* Preferred Hospital */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={formData.hasPreferredHospital}
              onChange={(e) => updateField('hasPreferredHospital', e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 rounded dark:bg-dark-700 dark:border-dark-500"
            />
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">
                I have a preferred hospital or healthcare system
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                We&apos;ll help ensure your doctors and hospitals are in-network
              </p>
            </div>
          </label>

          {formData.hasPreferredHospital && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hospital or health system name
              </label>
              <input
                type="text"
                value={formData.preferredHospitalName}
                onChange={(e) => updateField('preferredHospitalName', e.target.value)}
                placeholder="e.g., Mayo Clinic, Kaiser Permanente, Johns Hopkins"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-500 dark:bg-dark-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Hospital Importance */}
        {formData.hasPreferredHospital && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              How important is staying with this provider?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="group" aria-label="Hospital importance options">
              {[
                { value: 'must-stay', label: 'Must stay in-network', desc: 'Critical requirement' },
                { value: 'prefer', label: 'Prefer but flexible', desc: 'Would consider others' },
                { value: 'no-preference', label: 'No strong preference', desc: 'Open to options' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField('hospitalImportance', option.value)}
                  aria-pressed={formData.hospitalImportance === option.value}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.hospitalImportance === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                      : 'border-gray-200 dark:border-dark-500 hover:border-blue-300 dark:hover:border-blue-400 dark:bg-dark-700'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* National Coverage */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            How important is nationwide coverage for travel?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="group" aria-label="National coverage importance">
            {[
              { value: 'critical', label: 'Critical', desc: 'Travel frequently' },
              { value: 'moderate', label: 'Moderate', desc: 'Occasional travel' },
              { value: 'not-important', label: 'Not important', desc: 'Mostly stay local' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('needsNationalCoverage', option.value)}
                aria-pressed={formData.needsNationalCoverage === option.value}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.needsNationalCoverage === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                    : 'border-gray-200 dark:border-dark-500 hover:border-blue-300 dark:hover:border-blue-400 dark:bg-dark-700'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Priorities Section */}
      <div className="border-b border-gray-200 dark:border-dark-600 pb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <span className="text-2xl" role="img" aria-label="Money">💰</span>
          Financial Priorities
        </h3>

        {/* Main Priority */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            What&apos;s most important to you when choosing a plan?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="group" aria-label="Financial priority options">
            {[
              {
                value: 'lowest-premium',
                label: 'Lowest monthly premium',
                desc: 'Pay less each month, more when you need care',
                icon: '📉',
              },
              {
                value: 'lowest-deductible',
                label: 'Lowest deductible',
                desc: 'Insurance starts helping sooner when you need care',
                icon: '🏥',
              },
              {
                value: 'lowest-oop-max',
                label: 'Lowest out-of-pocket maximum',
                desc: 'Best protection against catastrophic costs',
                icon: '🛡️',
              },
              {
                value: 'balanced',
                label: 'Balanced approach',
                desc: 'Reasonable premium with moderate cost-sharing',
                icon: '⚖️',
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('financialPriority', option.value)}
                aria-pressed={formData.financialPriority === option.value}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.financialPriority === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                    : 'border-gray-200 dark:border-dark-500 hover:border-blue-300 dark:hover:border-blue-400 dark:bg-dark-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {errors.financialPriority && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.financialPriority}</p>
          )}
        </div>

        {/* Unexpected Bill */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Could you afford an unexpected $1,000-$3,000 medical bill?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="group" aria-label="Unexpected bill affordability">
            {[
              { value: 'yes-easily', label: 'Yes, easily', desc: 'Emergency fund available' },
              { value: 'yes-difficulty', label: 'Yes, with difficulty', desc: 'Would be a stretch' },
              { value: 'no-need-plan', label: 'No, would need payment plan', desc: 'Major hardship' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('canAffordUnexpectedBill', option.value)}
                aria-pressed={formData.canAffordUnexpectedBill === option.value}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.canAffordUnexpectedBill === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                    : 'border-gray-200 dark:border-dark-500 hover:border-blue-300 dark:hover:border-blue-400 dark:bg-dark-700'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
          {errors.canAffordUnexpectedBill && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.canAffordUnexpectedBill}</p>
          )}
        </div>
      </div>

      {/* Plan Type Preferences Section */}
      <div className="border-b border-gray-200 dark:border-dark-600 pb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <span className="text-2xl" role="img" aria-label="Clipboard">📋</span>
          Plan Type Preferences
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Select the types of insurance plans you&apos;d like to see recommendations for.
          We&apos;ll always show you the best overall option, plus the best options for each type you select.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="group" aria-label="Plan type selection">
          {availablePlanTypes.map((planType) => {
            const isSelected = (formData.preferredPlanTypes || []).includes(planType.value);
            return (
              <button
                key={planType.value}
                type="button"
                onClick={() => togglePlanType(planType.value)}
                aria-pressed={isSelected}
                aria-label={`${planType.label} - ${planType.description}`}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-900/30 dark:border-blue-400 dark:ring-blue-800'
                    : 'border-gray-200 dark:border-dark-500 hover:border-blue-300 dark:hover:border-blue-400 dark:bg-dark-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-600">
                    <span className="text-xl">{planType.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{planType.label}</span>
                      {isSelected && (
                        <span className="text-blue-600 dark:text-blue-400 text-sm" aria-hidden="true">✓</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{planType.fullName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{planType.description}</div>
                    <ul className="flex flex-wrap gap-2 mt-2" aria-label="Advantages">
                      {planType.pros.slice(0, 2).map((pro, idx) => (
                        <li key={idx} className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {(formData.preferredPlanTypes?.length || 0) > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg" aria-live="polite">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Selected types:</strong> {formData.preferredPlanTypes?.join(', ')}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              You&apos;ll see the best option for each type, ordered from best to worst fit for your situation.
            </p>
          </div>
        )}

        {(formData.preferredPlanTypes?.length || 0) === 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-500 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No specific types selected. We&apos;ll show you the overall best recommendation for your situation.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">Finding the right balance:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Lower premiums</strong> work best if you&apos;re healthy and have emergency savings
            </li>
            <li>
              <strong>Lower deductibles</strong> help if you have regular medical needs
            </li>
            <li>
              <strong>Lower out-of-pocket max</strong> protects against worst-case scenarios
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
