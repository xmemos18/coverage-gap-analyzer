'use client';

import { Residence, FormErrors, UpdateFieldFunction } from '@/types';
import { US_STATES } from '@/lib/states';
import { validateZipCode } from '@/lib/validation';
import { getStateFromZip } from '@/lib/zipToState';

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
  const updateResidence = (index: number, field: 'zip' | 'state', value: string) => {
    const updatedResidences = [...residences];

    // Sanitize ZIP code input
    if (field === 'zip') {
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
    } else {
      updatedResidences[index] = {
        ...updatedResidences[index],
        [field]: value,
      };
    }

    onUpdate('residences', updatedResidences);
  };

  const addResidence = () => {
    const updatedResidences = [...residences, { zip: '', state: '' }];
    onUpdate('residences', updatedResidences);
  };

  const removeResidence = (index: number) => {
    // Can only remove if more than 1 residence (primary residence is required)
    if (residences.length > 1) {
      const updatedResidences = residences.filter((_, i) => i !== index);
      onUpdate('residences', updatedResidences);
    }
  };

  const getResidenceLabel = (index: number) => {
    if (index === 0) return 'Primary Residence';
    if (index === 1) return 'Secondary Residence';
    return `Residence ${index + 1}`;
  };

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
            </div>
          );
        })}

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
