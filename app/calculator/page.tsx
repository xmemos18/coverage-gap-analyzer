'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalculatorFormData, FormErrors } from '@/types';
import Step1Residences from '@/components/calculator/Step1Residences';
import Step2Household from '@/components/calculator/Step2Household';
import Step2_5CurrentInsurance from '@/components/calculator/Step2_5CurrentInsurance';
import Step3Budget from '@/components/calculator/Step3Budget';

const INITIAL_FORM_DATA: CalculatorFormData = {
  // New array-based residences (minimum 2 required)
  residences: [
    { zip: '', state: '' }, // Primary
    { zip: '', state: '' }, // Secondary
  ],
  // Legacy fields for backward compatibility
  primaryResidence: { zip: '', state: '' },
  secondaryResidence: { zip: '', state: '' },
  hasThirdHome: false,
  thirdResidence: { zip: '', state: '' },
  numAdults: 0,
  adultAges: [],
  numChildren: 0,
  childAges: [],
  hasMedicareEligible: false,
  hasCurrentInsurance: false,
  currentInsurance: {
    carrier: '',
    planType: '',
    monthlyCost: 0,
    deductible: 0,
    outOfPocketMax: 0,
    coverageNotes: '',
  },
  budget: '',
  currentStep: 1,
};

const STORAGE_KEY = 'coverage-calculator-data';

export default function Calculator() {
  const router = useRouter();
  const [formData, setFormData] = useState<CalculatorFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Check if data is recent (within 24 hours)
        const savedTime = data.timestamp || 0;
        const now = Date.now();
        if (now - savedTime < 24 * 60 * 60 * 1000) {
          setShowResumePrompt(true);
        }
      } catch (e) {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save to localStorage whenever form changes
  useEffect(() => {
    const hasData = formData.currentStep > 1 ||
                    formData.residences.some(r => r.zip || r.state) ||
                    formData.numAdults > 0;

    if (hasData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...formData,
        timestamp: Date.now(),
      }));
    }
  }, [formData]);

  const resumeSavedData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        delete data.timestamp;
        setFormData(data);
      } catch (e) {
        // Invalid data
      }
    }
    setShowResumePrompt(false);
  };

  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setShowResumePrompt(false);
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate all residences in the array
    formData.residences.forEach((residence, index) => {
      // Validate ZIP code
      if (!residence.zip || residence.zip.length !== 5) {
        newErrors[`residence${index}Zip`] = 'Please enter a valid 5-digit ZIP code';
      }
      // Validate state
      if (!residence.state) {
        newErrors[`residence${index}State`] = 'Please select a state';
      }
    });

    // Ensure minimum of 2 residences
    if (formData.residences.length < 2) {
      newErrors.residences = 'You must have at least 2 residences';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.numAdults === 0) {
      newErrors.numAdults = 'Please select the number of adults';
    }

    // Validate adult ages
    formData.adultAges.forEach((age, index) => {
      if (!age || age < 18 || age > 100) {
        newErrors[`adultAge${index}`] = 'Please enter a valid age (18-100)';
      }
    });

    // Validate child ages
    formData.childAges.forEach((age, index) => {
      if (age < 0 || age > 17) {
        newErrors[`childAge${index}`] = 'Please enter a valid age (0-17)';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};

    // Only validate if user said they have current insurance
    if (formData.hasCurrentInsurance) {
      if (!formData.currentInsurance.carrier.trim()) {
        newErrors.carrier = 'Please enter your insurance carrier';
      }
      if (!formData.currentInsurance.planType) {
        newErrors.planType = 'Please select your plan type';
      }
      if (!formData.currentInsurance.monthlyCost || formData.currentInsurance.monthlyCost < 0) {
        newErrors.monthlyCost = 'Please enter a valid monthly cost';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.budget) {
      newErrors.budget = 'Please select a budget range';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    switch (formData.currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
    }

    if (isValid) {
      setFormData((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  const handleBack = () => {
    setFormData((prev) => ({
      ...prev,
      currentStep: prev.currentStep - 1,
    }));
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep4()) {
      return;
    }

    // Show loading spinner
    setIsLoading(true);

    // Simulate analysis delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Build URL parameters
    const params = new URLSearchParams();

    // Add residences as comma-separated zips and states
    const residenceZips = formData.residences.map(r => r.zip).join(',');
    const residenceStates = formData.residences.map(r => r.state).join(',');
    params.append('residenceZips', residenceZips);
    params.append('residenceStates', residenceStates);

    // Add household info
    params.append('numAdults', formData.numAdults.toString());
    params.append('adultAges', formData.adultAges.join(','));
    params.append('numChildren', formData.numChildren.toString());
    if (formData.numChildren > 0) {
      params.append('childAges', formData.childAges.join(','));
    }
    params.append('hasMedicareEligible', formData.hasMedicareEligible.toString());

    // Add current insurance if provided
    params.append('hasCurrentInsurance', formData.hasCurrentInsurance.toString());
    if (formData.hasCurrentInsurance) {
      params.append('currentCarrier', formData.currentInsurance.carrier);
      params.append('currentPlanType', formData.currentInsurance.planType);
      params.append('currentMonthlyCost', formData.currentInsurance.monthlyCost.toString());
      params.append('currentDeductible', formData.currentInsurance.deductible.toString());
      params.append('currentOutOfPocketMax', formData.currentInsurance.outOfPocketMax.toString());
      params.append('currentCoverageNotes', formData.currentInsurance.coverageNotes);
    }

    // Add budget
    params.append('budget', formData.budget);

    // Clear saved data on successful submission
    localStorage.removeItem(STORAGE_KEY);

    router.push(`/results?${params.toString()}`);
  };

  const stepNames = ['Residences', 'Household', 'Current Insurance', 'Budget'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Coverage Calculator</h1>
          <p className="text-gray-600 text-lg">Answer 4 quick questions to find your ideal insurance</p>
        </div>

        {/* Resume Prompt */}
        {showResumePrompt && (
          <div className="bg-blue-50 border-2 border-accent rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Continue where you left off?
            </h2>
            <p className="text-gray-700 mb-4">
              We found your previous progress. Would you like to resume?
            </p>
            <div className="flex gap-3">
              <button
                onClick={resumeSavedData}
                className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-light transition-colors"
              >
                Resume
              </button>
              <button
                onClick={clearSavedData}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-0 mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      formData.currentStep === step
                        ? 'bg-accent text-white scale-110'
                        : formData.currentStep > step
                        ? 'bg-success text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {formData.currentStep > step ? '✓' : step}
                  </div>
                  <div className={`text-xs font-semibold mt-2 ${
                    formData.currentStep === step ? 'text-accent' : 'text-gray-600'
                  }`}>
                    {stepNames[step - 1]}
                  </div>
                </div>
                {step < 4 && (
                  <div
                    className={`w-20 h-1 mb-6 transition-all ${
                      formData.currentStep > step ? 'bg-success' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 font-medium">
            Step {formData.currentStep} of 4: {stepNames[formData.currentStep - 1]}
          </p>

          {/* Clear Button */}
          {(formData.currentStep > 1 || formData.residences.some(r => r.zip || r.state)) && (
            <div className="text-center mt-4">
              <button
                onClick={clearSavedData}
                className="text-sm text-gray-500 hover:text-accent underline"
              >
                Clear and start over
              </button>
            </div>
          )}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {formData.currentStep === 1 && (
            <Step1Residences
              residences={formData.residences}
              errors={errors}
              onUpdate={updateField}
              onNext={handleNext}
            />
          )}

          {formData.currentStep === 2 && (
            <Step2Household
              numAdults={formData.numAdults}
              adultAges={formData.adultAges}
              numChildren={formData.numChildren}
              childAges={formData.childAges}
              hasMedicareEligible={formData.hasMedicareEligible}
              errors={errors}
              onUpdate={updateField}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {formData.currentStep === 3 && (
            <Step2_5CurrentInsurance
              hasCurrentInsurance={formData.hasCurrentInsurance}
              currentInsurance={formData.currentInsurance}
              errors={errors}
              onUpdate={updateField}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {formData.currentStep === 4 && (
            <Step3Budget
              budget={formData.budget}
              errors={errors}
              onUpdate={updateField}
              onSubmit={handleSubmit}
              onBack={handleBack}
            />
          )}
        </div>
      </div>

      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Analyzing Your Coverage...
            </h3>
            <p className="text-gray-600">
              Finding the best insurance options for your situation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
