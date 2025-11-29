'use client';

import { useState } from 'react';
import PrintButton from './PrintButton';
import ExportButton from './ExportButton';
import { trackResultsAction } from '@/lib/analytics';
import { logger } from '@/lib/logger';

interface ShareButtonsProps {
  data: unknown;
  summary: string;
  filename?: string;
}

/**
 * Collection of share and export buttons for results page
 */
export default function ShareButtons({ data, summary, filename }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track share action
      trackResultsAction('shared');
    } catch (error) {
      logger.error('[Share] Failed to copy link', { error });
      alert('Failed to copy link. Please copy manually from the address bar.');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('My Health Insurance Analysis Results');
    const body = encodeURIComponent(
      `I used Key Insurance Matters and here are my results:\n\n${summary}\n\nView full results: ${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;

    // Track share action
    trackResultsAction('shared');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 no-print">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">📤</span>
        Share & Export Results
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Print Button */}
        <PrintButton className="w-full justify-center" />

        {/* Export JSON Button */}
        <ExportButton
          data={data}
          filename={filename}
          className="w-full justify-center"
        />

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all"
          aria-label="Copy link to results"
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
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>

        {/* Email Share Button */}
        <button
          onClick={handleEmailShare}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all"
          aria-label="Share results via email"
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Email
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-4">
        Save these results to share with insurance agents or financial advisors.
      </p>
    </div>
  );
}
