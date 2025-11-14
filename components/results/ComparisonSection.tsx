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
    if (level === 'high') return {
      gradient: 'from-green-500 to-emerald-600',
      bgLight: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    };
    if (level === 'medium') return {
      gradient: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    };
    return {
      gradient: 'from-amber-500 to-yellow-600',
      bgLight: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    };
  };

  const getConfidenceLabel = (level: 'high' | 'medium' | 'low') => {
    if (level === 'high') return 'High Confidence';
    if (level === 'medium') return 'Medium Confidence';
    return 'Lower Confidence';
  };

  return (
    <section className="mb-12 md:mb-16 animate-fadeIn">
      {/* Premium Section Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-3xl md:text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
          🔄
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{title}</h2>
          {subtitle && <p className="text-base md:text-lg text-gray-600 font-medium">{subtitle}</p>}
        </div>
      </div>

      {/* Mobile: Premium Tab Interface */}
      {isMobile ? (
        <div>
          {/* Premium Tab Buttons */}
          <div className="flex overflow-x-auto gap-3 mb-6 pb-2 no-scrollbar">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveTab(option.id)}
                className={`
                  group relative flex-shrink-0 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300
                  ${activeTab === option.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                  }
                `}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {option.name}
                  {option.isRecommended && (
                    <span className={`text-base ${activeTab === option.id ? 'rotate-12' : 'rotate-0'} transition-transform duration-300`}>⭐</span>
                  )}
                </span>
                {activeTab === option.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
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
  expandedBenefits: string[];
  expandedDrawbacks: string[];
  toggleBenefits: (id: string) => void;
  toggleDrawbacks: (id: string) => void;
  getConfidenceColor: (level: 'high' | 'medium' | 'low') => {
    gradient: string;
    bgLight: string;
    text: string;
    border: string;
  };
  getConfidenceLabel: (level: 'high' | 'medium' | 'low') => string;
}

function ComparisonCard({
  option,
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
        group relative bg-white rounded-2xl overflow-hidden transition-all duration-300
        ${option.isRecommended
          ? 'ring-4 ring-blue-500 ring-offset-4 shadow-2xl'
          : 'border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:-translate-y-1'
        }
      `}
    >
      {/* Premium Card Header with Gradient */}
      <div
        className={`
          relative overflow-hidden p-6 md:p-8
          ${option.isRecommended
            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700'
            : 'bg-gradient-to-br from-gray-100 via-slate-100 to-gray-100'
          }
        `}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${option.isRecommended ? 'white' : '#64748b'} 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}
        ></div>

        <div className="relative">
          {/* Premium Recommended Badge */}
          {option.isRecommended && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-md border-2 border-white/40 rounded-xl mb-4 shadow-lg">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 rotate-12 transition-transform duration-300 group-hover:rotate-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-white text-sm font-bold uppercase tracking-wide drop-shadow-md">Recommended</span>
            </div>
          )}

          {/* Option Name */}
          <h3
            className={`text-2xl md:text-3xl font-bold mb-3 ${
              option.isRecommended ? 'text-white drop-shadow-md' : 'text-gray-900'
            }`}
          >
            {option.name}
          </h3>

          {/* Description */}
          <p
            className={`text-sm md:text-base mb-5 leading-relaxed ${
              option.isRecommended ? 'text-white/90' : 'text-gray-600'
            }`}
          >
            {option.description}
          </p>

          {/* Premium Monthly Estimate */}
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl md:text-5xl font-bold ${
                option.isRecommended ? 'text-white drop-shadow-lg' : 'bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent'
              }`}
            >
              {option.monthlyEstimate}
            </span>
            <span
              className={`text-lg font-medium ${option.isRecommended ? 'text-white/80' : 'text-gray-600'}`}
            >
              /month
            </span>
          </div>
        </div>
      </div>

      {/* Premium Card Body */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Premium Confidence Level Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 bg-gradient-to-r ${getConfidenceColor(option.confidenceLevel).gradient} ${getConfidenceColor(option.confidenceLevel).border} shadow-md`}>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/30 backdrop-blur-sm">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white drop-shadow-md">{getConfidenceLabel(option.confidenceLevel)}</span>
        </div>

        {/* Premium Benefits - Collapsible */}
        <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <button
            onClick={() => toggleBenefits(option.id)}
            className="flex items-center justify-between w-full text-left group/btn"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-lg shadow-md rotate-3 group-hover/btn:rotate-6 transition-transform duration-300">
                ✓
              </div>
              <h4 className="text-base md:text-lg font-bold text-green-900">
                Benefits ({option.benefits.length})
              </h4>
            </div>
            <svg
              className={`w-6 h-6 text-green-700 transition-transform duration-300 ${
                isExpanded(expandedBenefits, option.id) ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded(expandedBenefits, option.id) && (
            <ul className="mt-4 space-y-3 animate-fadeIn">
              {option.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-gray-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                    {idx + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Premium Drawbacks - Collapsible */}
        <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
          <button
            onClick={() => toggleDrawbacks(option.id)}
            className="flex items-center justify-between w-full text-left group/btn"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white text-lg shadow-md rotate-3 group-hover/btn:rotate-6 transition-transform duration-300">
                ⚠
              </div>
              <h4 className="text-base md:text-lg font-bold text-orange-900">
                Drawbacks ({option.drawbacks.length})
              </h4>
            </div>
            <svg
              className={`w-6 h-6 text-orange-700 transition-transform duration-300 ${
                isExpanded(expandedDrawbacks, option.id) ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded(expandedDrawbacks, option.id) && (
            <ul className="mt-4 space-y-3 animate-fadeIn">
              {option.drawbacks.map((drawback, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-gray-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                    {idx + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">{drawback}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Premium Best For Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 p-5 shadow-sm">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}
          ></div>
          <div className="relative flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg shadow-md rotate-3">
              🎯
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900 mb-2">Best For:</p>
              <p className="text-sm md:text-base text-gray-800 leading-relaxed">{option.bestFor}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Card Footer */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-slate-50 border-t-2 border-gray-200">
        <button
          className={`
            group/btn relative w-full py-4 px-6 rounded-xl font-bold text-base md:text-lg transition-all duration-300 overflow-hidden
            ${option.isRecommended
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02]'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg'
            }
          `}
        >
          {option.isRecommended && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          )}
          <span className="relative flex items-center justify-center gap-2">
            {option.actionLabel}
            <span className="text-xl transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}
