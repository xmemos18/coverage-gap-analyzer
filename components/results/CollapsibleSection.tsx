'use client';

import { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  summary: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  colorScheme?: 'blue' | 'orange' | 'green' | 'purple';
}

const colorClasses = {
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'from-blue-100 to-indigo-100',
    summaryGradient: 'from-blue-50 to-indigo-50',
    summaryBorder: 'border-blue-200',
  },
  orange: {
    gradient: 'from-orange-500 to-amber-600',
    iconBg: 'from-orange-100 to-amber-100',
    summaryGradient: 'from-orange-50 to-amber-50',
    summaryBorder: 'border-orange-200',
  },
  green: {
    gradient: 'from-green-500 to-emerald-600',
    iconBg: 'from-green-100 to-emerald-100',
    summaryGradient: 'from-green-50 to-emerald-50',
    summaryBorder: 'border-green-200',
  },
  purple: {
    gradient: 'from-purple-500 to-indigo-600',
    iconBg: 'from-purple-100 to-indigo-100',
    summaryGradient: 'from-purple-50 to-indigo-50',
    summaryBorder: 'border-purple-200',
  },
};

export default function CollapsibleSection({
  title,
  icon,
  summary,
  children,
  defaultExpanded = false,
  colorScheme = 'blue',
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = colorClasses[colorScheme];

  return (
    <div className="mb-10 md:mb-14 animate-fadeIn">
      {/* Premium Header with Icon */}
      <div className="results-section-header mb-6">
        <div className={`results-icon-lg bg-gradient-to-br ${colors.iconBg}`}>
          {icon}
        </div>
        <h3 className="results-section-title flex-1">
          {title}
        </h3>
      </div>

      {/* Premium Summary Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.summaryGradient} dark:${colors.summaryGradient.replace('50', '900/30')} border-2 ${colors.summaryBorder} p-6 md:p-8 mb-6 shadow-lg`}>
        <div className="results-pattern-dots text-gray-500"></div>
        <div className="relative">
          {summary}
        </div>
      </div>

      {/* Premium Expand/Collapse Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`group/btn px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center gap-3 border-2 shadow-md hover:shadow-xl ${
            isExpanded
              ? `bg-gradient-to-r ${colors.gradient} text-white border-transparent`
              : `bg-white text-gray-700 ${colors.summaryBorder} hover:bg-gradient-to-r hover:${colors.gradient} hover:text-white hover:border-transparent`
          }`}
        >
          <span>{isExpanded ? 'Hide' : 'Show'} Full Analysis</span>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Premium Expandable Content */}
      {isExpanded && (
        <div className="animate-fadeIn">
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-600 p-6 md:p-8 shadow-lg">
            <div className="results-pattern-dots text-gray-500 dark:text-gray-400"></div>
            <div className="relative">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
