'use client';

import { useState } from 'react';

interface Feature {
  id: string;
  text: string;
  icon?: string;
}

interface WhyThisRecommendationProps {
  explanation: string;
  features: Feature[];
  bestForDescription: string;
  isMobile?: boolean;
}

export default function WhyThisRecommendation({
  explanation,
  features,
  bestForDescription,
  isMobile = false,
}: WhyThisRecommendationProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 md:p-8 mt-6 md:mt-8 border border-gray-200">
      {/* Section Header */}
      <h2 className="flex items-center gap-3 text-xl md:text-2xl font-bold text-gray-900 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-6 h-6 md:w-7 md:h-7 text-yellow-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        </div>
        <span>Why This Recommendation?</span>
      </h2>

      {/* Content with Mobile Collapse */}
      <div className={isMobile && !expanded ? 'relative' : ''}>
        {/* Overview */}
        <div className={isMobile && !expanded ? 'line-clamp-3' : ''}>
          <p className="text-base md:text-lg text-gray-800 mb-6 leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Key Features */}
        {(expanded || !isMobile) && (
          <>
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Key Features
              </h3>
              {features.map((feature) => (
                <div key={feature.id} className="flex items-start gap-3">
                  {/* Check Circle Icon */}
                  <svg
                    className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 leading-relaxed">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Best For Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 md:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 mb-2">Best for:</p>
                  <p className="text-blue-800 leading-relaxed">{bestForDescription}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Fade Overlay */}
        {isMobile && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent" />
        )}
      </div>

      {/* Mobile Read More Button */}
      {isMobile && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          {expanded ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Show Less
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Read More
            </>
          )}
        </button>
      )}
    </section>
  );
}
