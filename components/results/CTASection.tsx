'use client';

import { useState } from 'react';

interface CTA {
  text: string;
  url: string;
  icon?: React.ReactNode;
  description?: string;
}

interface CTASectionProps {
  insuranceType: string;
  userState: string;
  primaryCTA: CTA;
  secondaryCTAs?: CTA[];
  enrollmentWarning?: string;
  isMobile?: boolean;
}

export default function CTASection({
  insuranceType,
  primaryCTA,
  secondaryCTAs = [],
  enrollmentWarning,
}: CTASectionProps) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const getEnrollmentMessage = (type: string) => {
    const messages: Record<string, string> = {
      Medicare: 'Compare plans and enroll using the official Medicare Plan Finder.',
      'ACA Marketplace': 'Compare marketplace plans and check if you qualify for subsidies.',
      Medicaid: 'Apply directly through your state Medicaid program.',
      Employer: 'Contact your employer benefits coordinator for enrollment instructions.',
    };
    return messages[type] || 'Find and compare plans to get started with enrollment.';
  };

  const defaultIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );

  const externalLinkIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );

  return (
    <section className="text-center mt-12 mb-8">
      {/* Section Header */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Ready to Enroll?</h2>
      <p className="text-base md:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        {getEnrollmentMessage(insuranceType)}
      </p>

      {/* Desktop: All Buttons Visible */}
      <div className="hidden md:flex md:flex-col md:items-center md:gap-4">
        {/* Primary CTA */}
        <a
          href={primaryCTA.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-lg touch-target"
        >
          {primaryCTA.icon || defaultIcon}
          <span>{primaryCTA.text}</span>
          {externalLinkIcon}
        </a>

        {/* Secondary CTAs */}
        {secondaryCTAs.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {secondaryCTAs.map((cta, idx) => (
              <a
                key={idx}
                href={cta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors touch-target"
              >
                {cta.icon || defaultIcon}
                <span>{cta.text}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: Primary + Dropdown */}
      <div className="md:hidden space-y-3">
        {/* Primary CTA - Full Width */}
        <a
          href={primaryCTA.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 bg-blue-600 text-white font-semibold rounded-xl text-center touch-target shadow-lg active:bg-blue-700 transition-colors"
        >
          {primaryCTA.text}
        </a>

        {/* Secondary CTAs - Collapsible */}
        {secondaryCTAs.length > 0 && (
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <button
              className="w-full py-4 px-4 flex items-center justify-between bg-white text-blue-600 font-semibold active:bg-gray-50 transition-colors"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
            >
              <span>+ More Resources ({secondaryCTAs.length})</span>
              <svg
                className={`w-5 h-5 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMoreOptions && (
              <div className="border-t-2 border-gray-300 divide-y divide-gray-200 bg-gray-50 animate-slideDown">
                {secondaryCTAs.map((cta, idx) => (
                  <a
                    key={idx}
                    href={cta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-4 px-4 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {cta.icon || defaultIcon}
                      <div className="flex-1">
                        <div className="font-semibold">{cta.text}</div>
                        {cta.description && (
                          <div className="text-xs text-gray-600 mt-1">{cta.description}</div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enrollment Period Warning */}
      {enrollmentWarning && (
        <div className="mt-8 bg-amber-50 border-2 border-amber-300 rounded-xl p-5 text-left shadow-sm max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 mb-2">📅 Enrollment Period Information</p>
              <p className="text-sm text-amber-800 leading-relaxed">{enrollmentWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Context */}
      <div className="mt-8 text-sm text-gray-600 max-w-2xl mx-auto">
        <p>
          💡 <strong>Need help?</strong> Most enrollment platforms offer live chat, phone support, and
          in-person assistance to guide you through the process.
        </p>
      </div>
    </section>
  );
}
