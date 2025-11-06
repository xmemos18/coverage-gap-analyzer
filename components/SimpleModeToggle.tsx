'use client';

import { useState } from 'react';

interface SimpleModeToggleProps {
  simpleMode: boolean;
  onToggle: (newMode: boolean) => void;
  hasFormData: boolean; // Whether user has started filling the form
}

export default function SimpleModeToggle({ simpleMode, onToggle, hasFormData }: SimpleModeToggleProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingMode, setPendingMode] = useState(simpleMode);

  const handleToggle = (newMode: boolean) => {
    // If user has form data, show confirmation before switching
    if (hasFormData && newMode !== simpleMode) {
      setPendingMode(newMode);
      setShowConfirmation(true);
    } else {
      // No data yet, switch immediately
      onToggle(newMode);
    }
  };

  const confirmSwitch = () => {
    onToggle(pendingMode);
    setShowConfirmation(false);
  };

  const cancelSwitch = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg border-2 border-gray-300 bg-white p-1 shadow-sm" role="group" aria-label="Calculator mode selector">
          <button
            type="button"
            onClick={() => handleToggle(true)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              simpleMode
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-pressed={simpleMode}
            aria-label="Switch to simple mode - fewer questions, faster results"
          >
            <span className="mr-2" aria-hidden="true">🎯</span>
            Simple Mode
          </button>
          <button
            type="button"
            onClick={() => handleToggle(false)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              !simpleMode
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-pressed={!simpleMode}
            aria-label="Switch to advanced mode - detailed questions, personalized recommendations"
          >
            <span className="mr-2" aria-hidden="true">⚙️</span>
            Advanced Mode
          </button>
        </div>
      </div>

      {/* Mode description */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          {simpleMode ? (
            <>
              <span className="font-semibold text-blue-600">Simple Mode:</span> Answer 3 quick questions for basic recommendations
            </>
          ) : (
            <>
              <span className="font-semibold text-blue-600">Advanced Mode:</span> Answer detailed questions for personalized recommendations
            </>
          )}
        </p>
      </div>

      {/* Confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Switch to {pendingMode ? 'Simple' : 'Advanced'} Mode?
            </h3>
            <p className="text-gray-700 mb-5">
              {pendingMode ? (
                <>
                  Switching to Simple Mode will skip optional questions and use reasonable defaults.
                  You&apos;ll get basic recommendations faster.
                </>
              ) : (
                <>
                  Switching to Advanced Mode will ask more questions about your health,
                  current insurance, and employment for better personalized recommendations.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmSwitch}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={cancelSwitch}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
