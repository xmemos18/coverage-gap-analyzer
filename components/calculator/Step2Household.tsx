'use client';

import { FormErrors, UpdateFieldFunction } from '@/types';
import InsuranceTerm from '@/components/InsuranceTerm';
import InfoTooltip from '@/components/InfoTooltip';

interface Step2Props {
  numAdults: number;
  adultAges: number[];
  numChildren: number;
  childAges: number[];
  hasMedicareEligible: boolean;
  hasEmployerInsurance: boolean;
  employerContribution: number;
  errors: FormErrors;
  onUpdate: UpdateFieldFunction;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Household({
  numAdults,
  adultAges,
  numChildren,
  childAges,
  hasMedicareEligible,
  hasEmployerInsurance,
  employerContribution,
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

  const validateAdultAge = (index: number) => {
    const newAges = [...adultAges];
    const age = newAges[index];

    // Skip validation if age is not provided or invalid
    // Let form validation catch empty/invalid inputs
    if (age === undefined || age === null || isNaN(age)) {
      return;
    }

    // Clamp age to valid range (18-120) and ensure integer
    // Treat 0 as invalid input and correct to minimum
    const validAge = Math.max(18, Math.min(120, Math.floor(age)));
    if (validAge !== age) {
      newAges[index] = validAge;
      onUpdate('adultAges', newAges);
    }
  };

  const updateChildAge = (index: number, age: number) => {
    const newAges = [...childAges];
    newAges[index] = age;
    onUpdate('childAges', newAges);
  };

  const validateChildAge = (index: number) => {
    const newAges = [...childAges];
    const age = newAges[index];

    // Skip validation if age is not provided or invalid
    // Let form validation catch empty/invalid inputs
    if (age === undefined || age === null || isNaN(age)) {
      return;
    }

    // Clamp age to valid range (0-17) and ensure integer
    const validAge = Math.max(0, Math.min(17, Math.floor(age)));
    if (validAge !== age) {
      newAges[index] = validAge;
      onUpdate('childAges', newAges);
    }
  };

  const validateEmployerContribution = () => {
    if (employerContribution === undefined || employerContribution === null || isNaN(employerContribution)) {
      return;
    }

    // Clamp employer contribution to valid range (0-10000)
    const validContribution = Math.max(0, Math.min(10000, Math.floor(employerContribution)));
    if (validContribution !== employerContribution) {
      onUpdate('employerContribution', validContribution);
    }
  };

  return (
    <div role="form" aria-labelledby="household-heading">
      <div className="mb-8">
        <h2 id="household-heading" className="text-3xl font-bold text-gray-900 mb-2">Your Household</h2>
        <p className="text-gray-600 text-lg">
          Tell us about who needs coverage.
        </p>
      </div>

      <div className="space-y-8">
        {/* Number of Adults */}
        <div role="group" aria-labelledby="adults-count-heading">
          <h3 id="adults-count-heading" className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            How many adults?
            <InfoTooltip content="We need to know how many adults (18+) need coverage. Premium costs are based on the number and age of people covered. Adults 65+ may qualify for Medicare instead." />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => handleAdultCountChange(count)}
                className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                  numAdults === count
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
                aria-label={`${count === 4 ? '4 or more' : count} adult${count > 1 ? 's' : ''}`}
                aria-pressed={numAdults === count}
              >
                {count === 4 ? '4+' : count}
              </button>
            ))}
          </div>
          {errors.numAdults && (
            <p className="text-red-600 text-sm mt-2" role="alert" aria-live="polite">
              {errors.numAdults}
            </p>
          )}
        </div>

        {/* Adult Ages */}
        {numAdults > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200" role="group" aria-labelledby="adult-ages-heading">
            <h3 id="adult-ages-heading" className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Age of each adult
              <InfoTooltip content="Age is the biggest factor in health insurance premiums. Older adults pay more than younger ones. We also use age to determine Medicare eligibility (65+) and special subsidies for those near retirement age." />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(numAdults)
                .fill(0)
                .map((_, index) => (
                  <div key={index}>
                    <label htmlFor={`adult-age-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Adult {index + 1} Age (18-120)
                    </label>
                    <input
                      id={`adult-age-${index}`}
                      type="number"
                      min="18"
                      max="120"
                      value={adultAges[index] || ''}
                      onChange={(e) => updateAdultAge(index, parseInt(e.target.value) || 0)}
                      onBlur={() => validateAdultAge(index)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      placeholder="e.g., 45"
                      aria-label={`Age of adult ${index + 1}`}
                      aria-required="true"
                      aria-invalid={!!errors[`adultAge${index}`]}
                      aria-describedby={errors[`adultAge${index}`] ? `adult-age-${index}-error` : undefined}
                    />
                    {errors[`adultAge${index}`] && (
                      <p id={`adult-age-${index}-error`} className="text-red-600 text-sm mt-1" role="alert" aria-live="polite">
                        {errors[`adultAge${index}`]}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Number of Children */}
        <div role="group" aria-labelledby="children-count-heading">
          <h3 id="children-count-heading" className="text-xl font-semibold text-gray-900 mb-4">How many children under 18?</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => handleChildCountChange(count)}
                className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                  numChildren === count
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
                aria-label={count === 0 ? 'No children' : `${count === 4 ? '4 or more' : count} child${count > 1 ? 'ren' : ''}`}
                aria-pressed={numChildren === count}
              >
                {count === 4 ? '4+' : count}
              </button>
            ))}
          </div>
        </div>

        {/* Child Ages */}
        {numChildren > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200" role="group" aria-labelledby="child-ages-heading">
            <h3 id="child-ages-heading" className="text-lg font-semibold text-gray-900 mb-4">Age of each child</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(numChildren)
                .fill(0)
                .map((_, index) => (
                  <div key={index}>
                    <label htmlFor={`child-age-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Child {index + 1} Age (0-17)
                    </label>
                    <input
                      id={`child-age-${index}`}
                      type="number"
                      min="0"
                      max="17"
                      value={childAges[index] || ''}
                      onChange={(e) => updateChildAge(index, parseInt(e.target.value) || 0)}
                      onBlur={() => validateChildAge(index)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      placeholder="e.g., 10"
                      aria-label={`Age of child ${index + 1}`}
                      aria-required="true"
                      aria-invalid={!!errors[`childAge${index}`]}
                      aria-describedby={errors[`childAge${index}`] ? `child-age-${index}-error` : undefined}
                    />
                    {errors[`childAge${index}`] && (
                      <p id={`child-age-${index}-error`} className="text-red-600 text-sm mt-1" role="alert" aria-live="polite">
                        {errors[`childAge${index}`]}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Medicare Eligibility */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200" role="group" aria-labelledby="medicare-heading">
          <h3 id="medicare-heading" className="text-lg font-semibold text-gray-900 mb-4">
            Is anyone <InsuranceTerm term="Medicare">Medicare-eligible</InsuranceTerm>?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Usually 65 years or older, or younger with certain disabilities
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => onUpdate('hasMedicareEligible', true)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                hasMedicareEligible
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
              }`}
              aria-label="Yes, someone is Medicare-eligible"
              aria-pressed={hasMedicareEligible}
            >
              Yes
            </button>
            <button
              onClick={() => onUpdate('hasMedicareEligible', false)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                !hasMedicareEligible
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
              }`}
              aria-label="No, nobody is Medicare-eligible"
              aria-pressed={!hasMedicareEligible}
            >
              No
            </button>
          </div>
        </div>

        {/* Employment & Coverage - NEW Phase 1 */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200" role="group" aria-labelledby="employment-heading">
          <h3 id="employment-heading" className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Employment & Coverage
            <InfoTooltip content="Employer-sponsored insurance affects marketplace eligibility and subsidies. If your employer plan is 'affordable' (costs less than 9.12% of income), you may not qualify for marketplace subsidies." />
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This helps us determine if employer coverage or marketplace plans are better for you
          </p>

          {/* Has Employer Insurance */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Does anyone in the household have access to employer health insurance?
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => onUpdate('hasEmployerInsurance', true)}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                  hasEmployerInsurance
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
                aria-label="Yes, have employer insurance"
                aria-pressed={hasEmployerInsurance}
              >
                Yes
              </button>
              <button
                onClick={() => onUpdate('hasEmployerInsurance', false)}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all ${
                  !hasEmployerInsurance
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
                aria-label="No employer insurance"
                aria-pressed={!hasEmployerInsurance}
              >
                No
              </button>
            </div>
          </div>

          {/* Employer Contribution - Show if has employer insurance */}
          {hasEmployerInsurance && (
            <div>
              <label htmlFor="employer-contribution" className="block text-sm font-medium text-gray-700 mb-2">
                What is the monthly employer contribution? (Optional)
                <span className="text-gray-500 font-normal ml-2">How much does your employer pay?</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input
                  id="employer-contribution"
                  type="number"
                  min="0"
                  max="10000"
                  value={employerContribution || ''}
                  onChange={(e) => onUpdate('employerContribution', parseInt(e.target.value) || 0)}
                  onBlur={validateEmployerContribution}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="500"
                  aria-label="Monthly employer contribution amount"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This helps us compare employer vs. marketplace plans
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-3 justify-between items-center mt-8 sticky-mobile-nav touch-manipulation" aria-label="Form navigation">
        <button
          onClick={onBack}
          className="px-6 py-3 flex-1 md:flex-initial border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
          aria-label="Go back to residences"
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="px-8 py-3 flex-1 md:flex-initial bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-500 shadow-lg transition-all touch-manipulation"
          aria-label="Continue to current insurance information"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
