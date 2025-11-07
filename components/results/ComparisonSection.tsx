'use client';

import { useState } from 'react';

interface ComparisonOption {
  id: string;
  name: string;
  description: string;
  monthlyEstimate: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  isRecommended: boolean;
  benefits: string[];
  drawbacks: string[];
  bestFor: string;
  actionLabel: string;
}

interface ComparisonSectionProps {
  title: string;
  subtitle?: string;
  options: ComparisonOption[];
  isMobile?: boolean;
}

export default function ComparisonSection({
  title,
  subtitle,
  options,
  isMobile = false,
}: ComparisonSectionProps) {
  const [activeTab, setActiveTab] = useState(options[0]?.id);
  const [expandedBenefits, setExpandedBenefits] = useState<string[]>([]);
  const [expandedDrawbacks, setExpandedDrawbacks] = useState<string[]>([]);

  const toggleBenefits = (optionId: string) => {
    setExpandedBenefits((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const toggleDrawbacks = (optionId: string) => {
    setExpandedDrawbacks((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const getConfidenceColor = (level: 'high' | 'medium' | 'low') => {
    if (level === 'high') return 'bg-green-100 text-green-700 border-green-300';
    if (level === 'medium') return 'bg-blue-100 text-blue-700 border-blue-300';
    return 'bg-amber-100 text-amber-700 border-amber-300';
  };

  const getConfidenceLabel = (level: 'high' | 'medium' | 'low') => {
    if (level === 'high') return 'High Confidence';
    if (level === 'medium') return 'Medium Confidence';
    return 'Lower Confidence';
  };

  return (
    <section className="mt-8 md:mt-12">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        {subtitle && <p className="text-base md:text-lg text-gray-600">{subtitle}</p>}
      </div>

      {/* Mobile: Tab Interface */}
      {isMobile ? (
        <div>
          {/* Tab Buttons */}
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveTab(option.id)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                  ${activeTab === option.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {option.name}
                {option.isRecommended && (
                  <span className="ml-2 text-xs">⭐</span>
                )}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          {options
            .filter((option) => option.id === activeTab)
            .map((option) => (
              <ComparisonCard
                key={option.id}
                option={option}
                isMobile={isMobile}
                expandedBenefits={expandedBenefits}
                expandedDrawbacks={expandedDrawbacks}
                toggleBenefits={toggleBenefits}
                toggleDrawbacks={toggleDrawbacks}
                getConfidenceColor={getConfidenceColor}
                getConfidenceLabel={getConfidenceLabel}
              />
            ))}
        </div>
      ) : (
        /* Desktop/Tablet: Side-by-side Cards */
        <div className={`grid gap-6 ${options.length === 2 ? 'md:grid-cols-2' : 'lg:grid-cols-3'}`}>
          {options.map((option) => (
            <ComparisonCard
              key={option.id}
              option={option}
              isMobile={false}
              expandedBenefits={expandedBenefits}
              expandedDrawbacks={expandedDrawbacks}
              toggleBenefits={toggleBenefits}
              toggleDrawbacks={toggleDrawbacks}
              getConfidenceColor={getConfidenceColor}
              getConfidenceLabel={getConfidenceLabel}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Comparison Card Component
interface ComparisonCardProps {
  option: ComparisonOption;
  isMobile: boolean;
  expandedBenefits: string[];
  expandedDrawbacks: string[];
  toggleBenefits: (id: string) => void;
  toggleDrawbacks: (id: string) => void;
  getConfidenceColor: (level: 'high' | 'medium' | 'low') => string;
  getConfidenceLabel: (level: 'high' | 'medium' | 'low') => string;
}

function ComparisonCard({
  option,
  isMobile: _isMobile,
  expandedBenefits,
  expandedDrawbacks,
  toggleBenefits,
  toggleDrawbacks,
  getConfidenceColor,
  getConfidenceLabel,
}: ComparisonCardProps) {
  const isExpanded = (list: string[], id: string) => list.includes(id);

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-lg overflow-hidden
        ${option.isRecommended ? 'ring-2 ring-blue-500 ring-offset-2' : 'border border-gray-200'}
      `}
    >
      {/* Card Header */}
      <div
        className={`
          p-6
          ${option.isRecommended
            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
            : 'bg-gradient-to-r from-gray-100 to-gray-200'
          }
        `}
      >
        {/* Recommended Badge */}
        {option.isRecommended && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-3">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white text-xs font-bold uppercase">Recommended</span>
          </div>
        )}

        {/* Option Name */}
        <h3
          className={`text-xl md:text-2xl font-bold mb-2 ${
            option.isRecommended ? 'text-white' : 'text-gray-900'
          }`}
        >
          {option.name}
        </h3>

        {/* Description */}
        <p
          className={`text-sm md:text-base mb-4 ${
            option.isRecommended ? 'text-blue-50' : 'text-gray-600'
          }`}
        >
          {option.description}
        </p>

        {/* Monthly Estimate */}
        <div className="flex items-baseline gap-2">
          <span
            className={`text-3xl md:text-4xl font-bold ${
              option.isRecommended ? 'text-white' : 'text-gray-900'
            }`}
          >
            {option.monthlyEstimate}
          </span>
          <span
            className={`text-base ${option.isRecommended ? 'text-blue-100' : 'text-gray-600'}`}
          >
            /month
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-6">
        {/* Confidence Level */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getConfidenceColor(option.confidenceLevel)}`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold">{getConfidenceLabel(option.confidenceLevel)}</span>
        </div>

        {/* Benefits - Collapsible */}
        <div>
          <button
            onClick={() => toggleBenefits(option.id)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Benefits ({option.benefits.length})
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded(expandedBenefits, option.id) ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded(expandedBenefits, option.id) && (
            <ul className="mt-3 space-y-2">
              {option.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Drawbacks - Collapsible */}
        <div>
          <button
            onClick={() => toggleDrawbacks(option.id)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="text-orange-500">⚠</span>
              Drawbacks ({option.drawbacks.length})
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded(expandedDrawbacks, option.id) ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded(expandedDrawbacks, option.id) && (
            <ul className="mt-3 space-y-2">
              {option.drawbacks.map((drawback, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-500 flex-shrink-0 mt-0.5">•</span>
                  <span>{drawback}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Best For */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Best For:</p>
          <p className="text-sm text-gray-600">{option.bestFor}</p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <button
          className={`
            w-full py-3 px-6 rounded-lg font-semibold text-base transition-all
            ${option.isRecommended
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
            }
          `}
        >
          {option.actionLabel}
        </button>
      </div>
    </div>
  );
}
