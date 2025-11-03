'use client';

import { Residence, FormErrors, UpdateFieldFunction } from '@/types';
import { US_STATES } from '@/lib/states';
import { validateZipCode, validateResidenceTimeDistribution } from '@/lib/validation';
import { getStateFromZip } from '@/lib/zipToState';
import { getMonthLabel, MONTH_OPTIONS } from '@/lib/residenceHelpers';
import InfoTooltip from '@/components/InfoTooltip';
import { useMemo } from 'react';

interface Step1Props {
  residences: Residence[];
  errors: FormErrors;
  onUpdate: UpdateFieldFunction;
  onNext: () => void;
}

export default function Step1Residences({
  residences,
  errors,
  onUpdate,
  onNext,
}: Step1Props) {
  const updateResidence = (index: number, field: 'zip' | 'state' | 'isPrimary' | 'monthsPerYear', value: string | boolean | number) => {
    const updatedResidences = [...residences];

    // Sanitize ZIP code input
    if (field === 'zip' && typeof value === 'string') {
      const { sanitized } = validateZipCode(value);
      updatedResidences[index] = {
        ...updatedResidences[index],
        [field]: sanitized,
      };

      // Auto-populate state if ZIP is valid (5 digits)
      if (sanitized.length === 5) {
        const detectedState = getStateFromZip(sanitized);
        if (detectedState) {
          updatedResidences[index].state = detectedState;
        }
      }
    } else if (field === 'isPrimary' && typeof value === 'boolean') {
      // If setting this residence as primary, unset all others
      if (value === true) {
        updatedResidences = updatedResidences.map((res, i) => ({
          ...res,
          isPrimary: i === index,
        }));
      }
    } else {
      updatedResidences[index] = {
        ...updatedResidences[index],
        [field]: value,
      };
    }

    onUpdate('residences', updatedResidences);
  };

  const addResidence = () => {
    const updatedResidences = [...residences, { zip: '', state: '', isPrimary: false, monthsPerYear: 0 }];
    onUpdate('residences', updatedResidences);
  };

  const removeResidence = (index: number) => {
    // Can only remove if more than 1 residence (primary residence is required)
    if (residences.length > 1) {
      const wasRemovingPrimary = residences[index].isPrimary;
      const updatedResidences = residences.filter((_, i) => i !== index);

      // If we removed the primary residence, set the first one as primary
      if (wasRemovingPrimary && updatedResidences.length > 0) {
        updatedResidences[0].isPrimary = true;
      }

      onUpdate('residences', updatedResidences);
    }
  };

  const getResidenceLabel = (index: number) => {
    if (index === 0) return 'Primary Residence';
    if (index === 1) return 'Secondary Residence';
    return `Residence ${index + 1}`;
  };

  // Calculate and validate time distribution
  const timeDistribution = useMemo(() => {
    return validateResidenceTimeDistribution(residences);
  }, [residences]);

  return (
    <div role="form" aria-labelledby="residences-heading">
      <div className="mb-8">
        <h2 id="residences-heading" className="text-3xl font-bold text-gray-900 mb-2">Your Residences</h2>
        <p className="text-gray-600 text-lg" id="residences-description">
          Tell us where you live. If you have multiple homes, you can add as many properties as you need.
        </p>
      </div>

      <div className="space-y-6">
        {/* Dynamically render all residences */}
        {residences.map((residence, index) => {
          const isPrimary = index === 0;
          const isSecondary = index === 1;
          const isRequired = isPrimary;
          const zipError = errors[`residence${index}Zip`];
          const stateError = errors[`residence${index}State`];

          return (
            <div
              key={index}
              className={`p-6 rounded-lg border-2 ${
                isPrimary
                  ? 'bg-blue-50 border-blue-300'
                  : isSecondary
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {getResidenceLabel(index)}
                  {isRequired && (
                    <span className="text-sm text-gray-600 font-normal ml-2">(Required)</span>
                  )}
                </h3>
                {!isRequired && (
                  <button
                    onClick={() => removeResidence(index)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                    aria-label={`Remove ${getResidenceLabel(index)}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ZIP Code */}
                <div>
                  <label
                    htmlFor={`residence-${index}-zip`}
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                  >
                    ZIP Code
                    <InfoTooltip content="We use your ZIP code to find health insurance plans available in your area and calculate accurate premium costs based on your location." />
                    {residence.zip.length === 5 && !zipError && (
                      <span className="text-success text-sm" aria-label="Valid ZIP code">✓</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      id={`residence-${index}-zip`}
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={residence.zip}
                      onChange={(e) => updateResidence(index, 'zip', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent ${
                        zipError
                          ? 'border-red-500'
                          : residence.zip.length === 5
                          ? 'border-success'
                          : 'border-gray-300'
                      }`}
                      placeholder="12345"
                      aria-label={`ZIP code for ${getResidenceLabel(index)}`}
                      aria-required="true"
                      aria-invalid={!!zipError}
                      aria-describedby={zipError ? `residence-${index}-zip-error` : undefined}
                    />
                    {residence.zip.length === 5 && !zipError && (
                      <span className="absolute right-3 top-2.5 text-success" aria-hidden="true">✓</span>
                    )}
                  </div>
                  {zipError && (
                    <p
                      id={`residence-${index}-zip-error`}
                      className="text-red-600 text-sm mt-1"
                      role="alert"
                      aria-live="polite"
                    >
                      {zipError}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label
                    htmlFor={`residence-${index}-state`}
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                  >
                    State
                    <InfoTooltip content="Different states have different insurance regulations, Medicaid eligibility rules, and available plans. This helps us provide state-specific recommendations and resources." />
                    {residence.state && !stateError && (
                      <span className="text-success text-sm" aria-label="Valid state selected">✓</span>
                    )}
                  </label>
                  <select
                    id={`residence-${index}-state`}
                    value={residence.state}
                    onChange={(e) => updateResidence(index, 'state', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent ${
                      stateError
                        ? 'border-red-500'
                        : residence.state
                        ? 'border-success'
                        : 'border-gray-300'
                    }`}
                    aria-label={`State for ${getResidenceLabel(index)}`}
                    aria-required="true"
                    aria-invalid={!!stateError}
                    aria-describedby={stateError ? `residence-${index}-state-error` : undefined}
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  {stateError && (
                    <p
                      id={`residence-${index}-state-error`}
                      className="text-red-600 text-sm mt-1"
                      role="alert"
                      aria-live="polite"
                    >
                      {stateError}
                    </p>
                  )}
                </div>
              </div>

              {/* Primary Residence Selection */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="primary-residence"
                      checked={residence.isPrimary}
                      onChange={() => updateResidence(index, 'isPrimary', true)}
                      className="w-5 h-5 text-accent focus:ring-accent"
                      aria-label={`Set ${getResidenceLabel(index)} as primary residence`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      This is my primary residence
                      {residence.isPrimary && (
                        <span className="ml-2 text-accent font-semibold">✓ Selected</span>
                      )}
                    </span>
                  </label>
                  {index === 0 && (
                    <p className="text-xs text-gray-500 mt-1 ml-8">
                      Your primary residence is where you spend most time and receive mail
                    </p>
                  )}
                </div>

                {/* Time Spent Per Year */}
                <div>
                  <label
                    htmlFor={`residence-${index}-months`}
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                  >
                    How much time do you spend here per year?
                    <InfoTooltip content="If you split time between multiple residences (snowbirds, seasonal workers), we need to know your time distribution to ensure you have coverage in all locations and meet plan requirements." />
                  </label>
                  <select
                    id={`residence-${index}-months`}
                    value={residence.monthsPerYear || ''}
                    onChange={(e) => updateResidence(index, 'monthsPerYear', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                    aria-label={`Time spent per year at ${getResidenceLabel(index)}`}
                  >
                    <option value="">Select timeframe</option>
                    {MONTH_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {/* Time Distribution Visual Indicator */}
        {residences.length > 1 && (
          <div className={`p-6 rounded-lg border-2 ${
            timeDistribution.isValid
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Time Distribution Across Residences
            </h3>

            {/* Visual bar chart */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Total: {timeDistribution.totalMonths} of 12 months
                </span>
                {timeDistribution.isValid ? (
                  <span className="text-green-600 text-sm">✓ Valid</span>
                ) : (
                  <span className="text-red-600 text-sm">✗ Exceeds 12 months</span>
                )}
              </div>

              {/* Progress bar */}
              <div
                className="w-full bg-gray-200 rounded-full h-6 overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={12}
                aria-valuenow={timeDistribution.totalMonths}
                aria-label={`Total time allocated: ${timeDistribution.totalMonths} of 12 months`}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    timeDistribution.isValid
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((timeDistribution.totalMonths / 12) * 100, 100)}%` }}
                  aria-hidden="true"
                >
                  <div className="text-xs text-white font-semibold text-center leading-6">
                    {timeDistribution.totalMonths > 0 && `${timeDistribution.totalMonths} months`}
                  </div>
                </div>
              </div>
            </div>

            {/* Individual residence breakdown */}
            <div className="space-y-2">
              {residences.map((residence, index) => {
                const months = residence.monthsPerYear || 0;
                if (months === 0) return null;

                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {getResidenceLabel(index)} ({residence.state || 'Unknown'})
                    </span>
                    <span className="font-semibold text-gray-900">
                      {getMonthLabel(months)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Error message */}
            {!timeDistribution.isValid && timeDistribution.error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                <strong>⚠️ Warning:</strong> {timeDistribution.error}
              </div>
            )}

            {/* Help text */}
            {timeDistribution.totalMonths < 12 && (
              <p className="mt-4 text-xs text-gray-600">
                💡 Tip: You have {12 - timeDistribution.totalMonths} months unaccounted for. Make sure to include all locations where you spend significant time.
              </p>
            )}
          </div>
        )}

        {/* Add Another Property Button */}
        <button
          onClick={addResidence}
          className="w-full px-6 py-4 border-2 border-dashed border-accent text-accent rounded-lg font-semibold text-lg hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2"
          aria-label="Add another property to your residences"
        >
          <span className="text-2xl" aria-hidden="true">+</span>
          Add Another Property
        </button>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-end sticky-mobile-nav touch-manipulation">
        <button
          onClick={onNext}
          className="px-8 py-3 w-full md:w-auto bg-accent text-white rounded-lg font-semibold text-lg hover:bg-accent-light shadow-lg transition-all touch-manipulation"
          aria-label="Continue to household information"
        >
          Next
        </button>
      </div>
    </div>
  );
}
