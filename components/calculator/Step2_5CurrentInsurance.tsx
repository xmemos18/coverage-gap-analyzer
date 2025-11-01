'use client';

import { CurrentInsurance, FormErrors } from '@/types';

interface Step2_5Props {
  hasCurrentInsurance: boolean;
  currentInsurance: CurrentInsurance;
  errors: FormErrors;
  onUpdate: (field: string, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2_5CurrentInsurance({
  hasCurrentInsurance,
  currentInsurance,
  errors,
  onUpdate,
  onNext,
  onBack,
}: Step2_5Props) {
  const updateInsuranceField = (field: keyof CurrentInsurance, value: string | number) => {
    const updated = { ...currentInsurance, [field]: value };
    onUpdate('currentInsurance', updated);
  };

  const planTypes = [
    'HMO',
    'PPO',
    'EPO',
    'POS',
    'Medicare Advantage',
    'Medigap',
    'Original Medicare',
    'Medicaid',
    'Other'
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Current Insurance</h2>
        <p className="text-gray-600 text-lg">
          Tell us about your current insurance so we can provide personalized suggestions.
        </p>
      </div>

      <div className="space-y-8">
        {/* Do you have current insurance? */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Do you currently have health insurance?
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => onUpdate('hasCurrentInsurance', true)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                hasCurrentInsurance
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-accent'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => onUpdate('hasCurrentInsurance', false)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                !hasCurrentInsurance
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-accent'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Current Insurance Details (shown only if hasCurrentInsurance is true) */}
        {hasCurrentInsurance && (
          <div className="space-y-6">
            {/* Carrier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Carrier
              </label>
              <input
                type="text"
                value={currentInsurance.carrier}
                onChange={(e) => updateInsuranceField('carrier', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="e.g., Blue Cross Blue Shield, UnitedHealthcare, Aetna"
              />
              {errors.carrier && <p className="text-red-600 text-sm mt-2">{errors.carrier}</p>}
            </div>

            {/* Plan Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type
              </label>
              <select
                value={currentInsurance.planType}
                onChange={(e) => updateInsuranceField('planType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-white"
              >
                <option value="">Select plan type...</option>
                {planTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.planType && <p className="text-red-600 text-sm mt-2">{errors.planType}</p>}
            </div>

            {/* Monthly Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Premium Cost
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-600 text-lg">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentInsurance.monthlyCost || ''}
                  onChange={(e) => updateInsuranceField('monthlyCost', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="500"
                />
              </div>
              {errors.monthlyCost && <p className="text-red-600 text-sm mt-2">{errors.monthlyCost}</p>}
            </div>

            {/* Deductible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Deductible
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-600 text-lg">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={currentInsurance.deductible || ''}
                  onChange={(e) => updateInsuranceField('deductible', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="2000"
                />
              </div>
              {errors.deductible && <p className="text-red-600 text-sm mt-2">{errors.deductible}</p>}
            </div>

            {/* Out of Pocket Max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Out-of-Pocket Maximum
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-600 text-lg">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={currentInsurance.outOfPocketMax || ''}
                  onChange={(e) => updateInsuranceField('outOfPocketMax', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="8000"
                />
              </div>
              {errors.outOfPocketMax && <p className="text-red-600 text-sm mt-2">{errors.outOfPocketMax}</p>}
            </div>

            {/* Coverage Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Coverage Details (Optional)
              </label>
              <textarea
                value={currentInsurance.coverageNotes}
                onChange={(e) => updateInsuranceField('coverageNotes', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="e.g., Nationwide network, prescription drug coverage, dental included, etc."
              />
              {errors.coverageNotes && <p className="text-red-600 text-sm mt-2">{errors.coverageNotes}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="px-8 py-3 bg-accent text-white rounded-lg font-semibold text-lg hover:bg-accent-light shadow-lg transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
}
