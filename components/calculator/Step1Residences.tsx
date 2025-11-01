'use client';

import { Residence, FormErrors } from '@/types';
import { US_STATES } from '@/lib/states';

interface Step1Props {
  residences: Residence[];
  errors: FormErrors;
  onUpdate: (field: string, value: unknown) => void;
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
    updatedResidences[index] = {
      ...updatedResidences[index],
      [field]: value,
    };
    onUpdate('residences', updatedResidences);
  };

  const addResidence = () => {
    const updatedResidences = [...residences, { zip: '', state: '' }];
    onUpdate('residences', updatedResidences);
  };

  const removeResidence = (index: number) => {
    // Can only remove if more than 2 residences (primary and secondary are required)
    if (residences.length > 2) {
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
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Residences</h2>
        <p className="text-gray-600 text-lg">
          Tell us where you own or rent homes. You can add as many properties as you need.
        </p>
      </div>

      <div className="space-y-6">
        {/* Dynamically render all residences */}
        {residences.map((residence, index) => {
          const isPrimary = index === 0;
          const isSecondary = index === 1;
          const isRequired = isPrimary || isSecondary;
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
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ZIP Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    ZIP Code
                    {residence.zip.length === 5 && !zipError && (
                      <span className="text-success text-sm">✓</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={5}
                      value={residence.zip}
                      onChange={(e) => updateResidence(index, 'zip', e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent ${
                        zipError
                          ? 'border-red-500'
                          : residence.zip.length === 5
                          ? 'border-success'
                          : 'border-gray-300'
                      }`}
                      placeholder="12345"
                    />
                    {residence.zip.length === 5 && !zipError && (
                      <span className="absolute right-3 top-2.5 text-success">✓</span>
                    )}
                  </div>
                  {zipError && <p className="text-red-600 text-sm mt-1">{zipError}</p>}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    State
                    {residence.state && !stateError && (
                      <span className="text-success text-sm">✓</span>
                    )}
                  </label>
                  <select
                    value={residence.state}
                    onChange={(e) => updateResidence(index, 'state', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent ${
                      stateError
                        ? 'border-red-500'
                        : residence.state
                        ? 'border-success'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  {stateError && <p className="text-red-600 text-sm mt-1">{stateError}</p>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Another Property Button */}
        <button
          onClick={addResidence}
          className="w-full px-6 py-4 border-2 border-dashed border-accent text-accent rounded-lg font-semibold text-lg hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span className="text-2xl">+</span>
          Add Another Property
        </button>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-end">
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
