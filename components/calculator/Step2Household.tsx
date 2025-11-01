'use client';

import { FormErrors } from '@/types';

interface Step2Props {
  numAdults: number;
  adultAges: number[];
  numChildren: number;
  childAges: number[];
  hasMedicareEligible: boolean;
  errors: FormErrors;
  onUpdate: (field: string, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Household({
  numAdults,
  adultAges,
  numChildren,
  childAges,
  hasMedicareEligible,
  errors,
  onUpdate,
  onNext,
  onBack,
}: Step2Props) {
  const handleAdultCountChange = (count: number) => {
    onUpdate('numAdults', count);
    // Initialize or trim adult ages array
    const newAges = Array(count).fill(0).map((_, i) => adultAges[i] || 0);
    onUpdate('adultAges', newAges);
  };

  const handleChildCountChange = (count: number) => {
    onUpdate('numChildren', count);
    // Initialize or trim child ages array
    const newAges = Array(count).fill(0).map((_, i) => childAges[i] || 0);
    onUpdate('childAges', newAges);
  };

  const updateAdultAge = (index: number, age: number) => {
    const newAges = [...adultAges];
    newAges[index] = age;
    onUpdate('adultAges', newAges);
  };

  const updateChildAge = (index: number, age: number) => {
    const newAges = [...childAges];
    newAges[index] = age;
    onUpdate('childAges', newAges);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Household</h2>
        <p className="text-gray-600 text-lg">
          Tell us about who needs coverage.
        </p>
      </div>

      <div className="space-y-8">
        {/* Number of Adults */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">How many adults?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => handleAdultCountChange(count)}
                className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                  numAdults === count
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-accent'
                }`}
              >
                {count === 4 ? '4+' : count}
              </button>
            ))}
          </div>
          {errors.numAdults && <p className="text-red-600 text-sm mt-2">{errors.numAdults}</p>}
        </div>

        {/* Adult Ages */}
        {numAdults > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Age of each adult</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(numAdults)
                .fill(0)
                .map((_, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adult {index + 1} Age (18-100)
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={adultAges[index] || ''}
                      onChange={(e) => updateAdultAge(index, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                      placeholder="e.g., 45"
                    />
                    {errors[`adultAge${index}`] && (
                      <p className="text-red-600 text-sm mt-1">{errors[`adultAge${index}`]}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Number of Children */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">How many children under 18?</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => handleChildCountChange(count)}
                className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                  numChildren === count
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-accent'
                }`}
              >
                {count === 4 ? '4+' : count}
              </button>
            ))}
          </div>
        </div>

        {/* Child Ages */}
        {numChildren > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Age of each child</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(numChildren)
                .fill(0)
                .map((_, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Child {index + 1} Age (0-17)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="17"
                      value={childAges[index] || ''}
                      onChange={(e) => updateChildAge(index, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                      placeholder="e.g., 10"
                    />
                    {errors[`childAge${index}`] && (
                      <p className="text-red-600 text-sm mt-1">{errors[`childAge${index}`]}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Medicare Eligibility */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Is anyone Medicare-eligible?</h3>
          <div className="flex gap-4">
            <button
              onClick={() => onUpdate('hasMedicareEligible', true)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                hasMedicareEligible
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-accent'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => onUpdate('hasMedicareEligible', false)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                !hasMedicareEligible
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-accent'
              }`}
            >
              No
            </button>
          </div>
        </div>
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
