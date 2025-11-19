'use client';

import { CalculatorFormData, UpdateFieldFunction } from '@/types';

interface Step2_4Props {
  formData: CalculatorFormData;
  updateField: UpdateFieldFunction;
  errors: { [key: string]: string };
}

export default function Step2_4HealthcareUsage({
  formData,
  updateField,
  errors,
}: Step2_4Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Healthcare Usage</h2>
        <p className="text-gray-600">
          Understanding your healthcare needs helps us recommend the right plan type for you.
        </p>
      </div>

      {/* Doctor Visits */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          How many times did you visit a doctor in the past year?
          <span className="text-gray-500 font-normal ml-2">(Primary care, urgent care, etc.)</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: '0-2', label: '0-2 visits', desc: 'Preventive only' },
            { value: '3-5', label: '3-5 visits', desc: 'Occasional care' },
            { value: '6-10', label: '6-10 visits', desc: 'Regular care' },
            { value: '10+', label: '10+ visits', desc: 'Frequent care' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('doctorVisitsPerYear', option.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.doctorVisitsPerYear === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
        {errors.doctorVisitsPerYear && (
          <p className="text-red-600 text-sm mt-2">{errors.doctorVisitsPerYear}</p>
        )}
      </div>

      {/* Specialist Visits */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          How often do you see specialists?
          <span className="text-gray-500 font-normal ml-2">(Cardiologist, dermatologist, etc.)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'none', label: 'None', desc: 'No specialist visits' },
            { value: '1-3', label: '1-3 per year', desc: 'Occasional specialist' },
            { value: 'monthly-or-more', label: 'Monthly or more', desc: 'Regular specialist care' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('specialistVisitsPerYear', option.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.specialistVisitsPerYear === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ER Visits */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Emergency room visits in the past year?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'none', label: 'None' },
            { value: '1-2', label: '1-2 times' },
            { value: '3+', label: '3 or more' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('erVisitsPerYear', option.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.erVisitsPerYear === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Planned Procedures */}
      <div className="border-t pt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.plannedProcedures}
            onChange={(e) => updateField('plannedProcedures', e.target.checked)}
            className="mt-1 h-5 w-5 text-blue-600 rounded"
          />
          <div>
            <span className="font-semibold text-gray-900">
              I have planned surgeries or procedures in the next 12 months
            </span>
            <p className="text-sm text-gray-600 mt-1">
              This helps us recommend plans with lower deductibles
            </p>
          </div>
        </label>
      </div>

      {/* Medication Section */}
      <div className="border-t pt-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>💊</span> Medications
        </h3>

        {/* Specialty Medications */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.takesSpecialtyMeds}
              onChange={(e) => updateField('takesSpecialtyMeds', e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 rounded"
            />
            <div>
              <span className="font-semibold text-gray-900">
                I take specialty medications
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Biologics, injectables, chemotherapy, or other high-cost medications
              </p>
            </div>
          </label>
        </div>

        {/* Monthly Medication Cost */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            What do you currently spend on medications per month?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: 'under-50', label: 'Under $50' },
              { value: '50-200', label: '$50-$200' },
              { value: '200-500', label: '$200-$500' },
              { value: '500-1000', label: '$500-$1,000' },
              { value: 'over-1000', label: 'Over $1,000' },
              { value: 'none', label: 'No medications' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('monthlyMedicationCost', option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.monthlyMedicationCost === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mail Order Pharmacy */}
        <div className="mt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.usesMailOrderPharmacy}
              onChange={(e) => updateField('usesMailOrderPharmacy', e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 rounded"
            />
            <div>
              <span className="font-semibold text-gray-900">
                I use or am interested in mail-order pharmacy
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Mail-order often provides 90-day supplies at lower cost
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="text-sm text-gray-700">
          <p className="font-semibold text-gray-900 mb-1">Why we ask:</p>
          <p>
            Frequent care needs typically benefit from plans with lower deductibles and better
            copays, even if premiums are higher. Healthy individuals may save more with
            high-deductible plans paired with HSAs.
          </p>
        </div>
      </div>
    </div>
  );
}
