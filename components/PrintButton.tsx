'use client';

import { useState } from 'react';
import { trackResultsAction } from '@/lib/analytics';

interface PrintButtonProps {
  className?: string;
  label?: string;
}

/**
 * Print button component that triggers browser print dialog
 * Optimized for printing results pages
 */
export default function PrintButton({
  className = '',
  label = 'Print Results'
}: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);

    // Track print action
    trackResultsAction('printed');

    // Give a moment for state to update (if needed for UI changes)
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className={`flex items-center gap-2 px-6 py-3 bg-white border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed no-print ${className}`}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      {isPrinting ? 'Preparing...' : label}
    </button>
  );
}
