'use client';

import { CALCULATOR_STEPS, STEP_NAMES } from '@/lib/constants';

interface MobileProgressBarProps {
  currentStep: number;
}

/**
 * Compact progress indicator optimized for mobile screens
 * Shows current step and progress percentage
 */
export default function MobileProgressBar({ currentStep }: MobileProgressBarProps) {
  const progress = (currentStep / CALCULATOR_STEPS.TOTAL_STEPS) * 100;
  const stepName = STEP_NAMES[currentStep - 1];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 md:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-900">
            Step {currentStep} of {CALCULATOR_STEPS.TOTAL_STEPS}
          </div>
          <div className="text-xs font-medium text-gray-600">
            {stepName}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={CALCULATOR_STEPS.TOTAL_STEPS}
            aria-label={`Step ${currentStep} of ${CALCULATOR_STEPS.TOTAL_STEPS}: ${stepName}`}
          />
        </div>
      </div>
    </div>
  );
}
