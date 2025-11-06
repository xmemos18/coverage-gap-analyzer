'use client';

import { useState } from 'react';
import ShareButtons from '@/components/ShareButtons';
import { PDFDownloadButton } from '@/components/PDFReport';
import { InsuranceRecommendation } from '@/types';

interface ResultsActionsProps {
  recommendation: InsuranceRecommendation;
  formData: {
    residences: Array<{ zip: string; state: string }>;
    numAdults: number;
    numChildren: number;
    adultAges: number[];
    childAges: number[];
    budget: string;
    incomeRange: string;
  };
}

export default function ResultsActions({ recommendation, formData }: ResultsActionsProps) {
  const [isFABOpen, setIsFABOpen] = useState(false);

  const handlePrint = () => {
    window.print();
    setIsFABOpen(false);
  };

  const summary = `${recommendation.recommendedInsurance} - Estimated Cost: $${recommendation.estimatedMonthlyCost.low}-${recommendation.estimatedMonthlyCost.high}/month`;

  return (
    <>
      {/* Desktop: Sticky Toolbar (hidden on mobile) */}
      <div className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Quick Actions:</span>
            </div>
            <div className="flex items-center gap-3">
              <ShareButtons
                data={{
                  recommendation,
                  formData,
                  generatedDate: new Date().toISOString()
                }}
                summary={summary}
                filename="insurance-analysis"
              />
              <PDFDownloadButton
                recommendation={recommendation}
                formData={formData}
              />
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Floating Action Button */}
      <div className="md:hidden print:hidden">
        {/* FAB Menu (when open) */}
        {isFABOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fadeIn"
              onClick={() => setIsFABOpen(false)}
            />

            {/* Action Menu */}
            <div className="fixed bottom-24 right-4 z-50 bg-white rounded-lg shadow-2xl p-3 space-y-2 animate-slideUp">
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Print</div>
                  <div className="text-xs text-gray-600">Print results</div>
                </div>
              </button>

              <div className="border-t border-gray-200 pt-2">
                <PDFDownloadButton
                  recommendation={recommendation}
                  formData={formData}
                />
              </div>

              <div className="border-t border-gray-200 pt-2">
                <ShareButtons
                  data={{
                    recommendation,
                    formData,
                    generatedDate: new Date().toISOString()
                  }}
                  summary={summary}
                  filename="insurance-analysis"
                />
              </div>
            </div>
          </>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setIsFABOpen(!isFABOpen)}
          className={`
            fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-2xl
            flex items-center justify-center transition-all duration-200
            ${isFABOpen ? 'bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}
          `}
          aria-label="Quick actions"
        >
          {isFABOpen ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
