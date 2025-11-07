'use client';

import { useState } from 'react';

interface ShoppingTip {
  title: string;
  description: string;
  icon?: React.ReactNode;
  link?: {
    text: string;
    url: string;
  };
}

interface ShoppingTipsProps {
  tips: ShoppingTip[];
  insuranceType: string;
  isMobile?: boolean;
}

export default function ShoppingTips({ tips, insuranceType, isMobile = false }: ShoppingTipsProps) {
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  const defaultIcon = (
    <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 mt-8 md:mt-12 border border-blue-200">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-3 text-xl md:text-2xl font-bold text-gray-900">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 md:w-7 md:h-7 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          </div>
          <span>Shopping Tips</span>
        </h2>

        {/* Count Badge */}
        <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white font-bold rounded-full text-sm md:text-base">
          {tips.length}
        </span>
      </div>

      {/* Desktop: All Tips Visible */}
      <ul className="hidden md:space-y-5 md:block">
        {tips.map((tip, idx) => (
          <li key={idx} className="flex gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 mt-1">{tip.icon || defaultIcon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">{tip.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{tip.description}</p>
              {tip.link && (
                <a
                  href={tip.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  <span>{tip.link.text}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Mobile: Accordion List */}
      <div className="md:hidden space-y-0">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className="border-b border-blue-200 last:border-0"
          >
            <button
              className="w-full flex items-center justify-between py-4 text-left group"
              onClick={() => setExpandedTip(expandedTip === idx ? null : idx)}
            >
              <span className="font-semibold text-sm text-gray-900 flex items-center gap-3 flex-1 pr-4">
                <span className="flex-shrink-0">{tip.icon || defaultIcon}</span>
                <span className="line-clamp-1">{tip.title}</span>
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                  expandedTip === idx ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedTip === idx && (
              <div className="pb-4 pl-9 pr-2 animate-fadeIn">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{tip.description}</p>
                {tip.link && (
                  <a
                    href={tip.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm"
                  >
                    <span>{tip.link.text}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contextual Footer Message */}
      <div className="mt-6 pt-6 border-t border-blue-200">
        <p className="text-sm text-blue-900 flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            These tips are specific to {insuranceType}. Always verify information with official sources
            before making enrollment decisions.
          </span>
        </p>
      </div>
    </section>
  );
}
