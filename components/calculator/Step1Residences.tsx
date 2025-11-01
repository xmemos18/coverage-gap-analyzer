'use client';

import { Residence, FormErrors } from '@/types';
import { US_STATES } from '@/lib/states';

interface Step1Props {
  primaryResidence: Residence;
  secondaryResidence: Residence;
  hasThirdHome: boolean;
  thirdResidence: Residence;
  errors: FormErrors;
  onUpdate: (field: string, value: unknown) => void;
  onNext: () => void;
}

export default function Step1Residences({
  primaryResidence,
  secondaryResidence,
  hasThirdHome,
  thirdResidence,
  errors,
  onUpdate,
  onNext,
}: Step1Props) {
  const updateResidence = (type: 'primary' | 'secondary' | 'third', field: 'zip' | 'state', value: string) => {
    const residenceField = type === 'primary' ? 'primaryResidence' : type === 'secondary' ? 'secondaryResidence' : 'thirdResidence';
    const currentResidence = type === 'primary' ? primaryResidence : type === 'secondary' ? secondaryResidence : thirdResidence;

    onUpdate(residenceField, {
      ...currentResidence,
      [field]: value,
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Residences</h2>
        <p className="text-gray-600 text-lg">
          Tell us where you own or rent homes.
        </p>
      </div>

      <div className="space-y-6">
        {/* Primary Residence */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Primary Residence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                ZIP Code
                {primaryResidence.zip.length === 5 && !errors.primaryZip && (
                  <span className="text-success text-sm">✓</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={5}
                  value={primaryResidence.zip}
                  onChange={(e) => updateResidence('primary', 'zip', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent ${
                    errors.primaryZip ? 'border-red-500' : primaryResidence.zip.length === 5 ? 'border-success' : 'border-gray-300'
                  }`}
                  placeholder="12345"
                />
                {primaryResidence.zip.length === 5 && !errors.primaryZip && (
                  <span className="absolute right-3 top-2.5 text-success">✓</span>
                )}
              </div>
              {errors.primaryZip && <p className="text-red-600 text-sm mt-1">{errors.primaryZip}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                State
                {primaryResidence.state && !errors.primaryState && (
                  <span className="text-success text-sm">✓</span>
                )}
              </label>
              <select
                value={primaryResidence.state}
                onChange={(e) => updateResidence('primary', 'state', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent ${
                  errors.primaryState ? 'border-red-500' : primaryResidence.state ? 'border-success' : 'border-gray-300'
                }`}
              >
                <option value="">Select a state</option>
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.primaryState && <p className="text-red-600 text-sm mt-1">{errors.primaryState}</p>}
            </div>
          </div>
        </div>

        {/* Secondary Residence */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Secondary Residence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                maxLength={5}
                value={secondaryResidence.zip}
                onChange={(e) => updateResidence('secondary', 'zip', e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="67890"
              />
              {errors.secondaryZip && <p className="text-red-600 text-sm mt-1">{errors.secondaryZip}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                value={secondaryResidence.state}
                onChange={(e) => updateResidence('secondary', 'state', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
              >
                <option value="">Select a state</option>
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.secondaryState && <p className="text-red-600 text-sm mt-1">{errors.secondaryState}</p>}
            </div>
          </div>
        </div>

        {/* Third Home Checkbox */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasThirdHome}
              onChange={(e) => onUpdate('hasThirdHome', e.target.checked)}
              className="w-5 h-5 text-accent focus:ring-accent border-gray-300 rounded"
            />
            <span className="text-gray-900 font-medium">
              I have a third home
            </span>
          </label>
        </div>

        {/* Third Residence (conditional) */}
        {hasThirdHome && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Third Residence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={thirdResidence.zip}
                  onChange={(e) => updateResidence('third', 'zip', e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="11111"
                />
                {errors.thirdZip && <p className="text-red-600 text-sm mt-1">{errors.thirdZip}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={thirdResidence.state}
                  onChange={(e) => updateResidence('third', 'state', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="">Select a state</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {errors.thirdState && <p className="text-red-600 text-sm mt-1">{errors.thirdState}</p>}
              </div>
            </div>
          </div>
        )}
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
