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
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    summaryBg: 'bg-white',
    summaryBorder: 'border-blue-200',
    button: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-yellow-50',
    border: 'border-orange-200',
    summaryBg: 'bg-white',
    summaryBorder: 'border-orange-200',
    button: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-200',
    summaryBg: 'bg-white',
    summaryBorder: 'border-green-200',
    button: 'bg-green-100 hover:bg-green-200 text-green-700',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-purple-200',
    summaryBg: 'bg-white',
    summaryBorder: 'border-purple-200',
    button: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
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
    <div className={`mb-8 ${colors.bg} rounded-lg p-6 md:p-8 border-2 ${colors.border}`}>
      {/* Header */}
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
        <span className="text-3xl md:text-4xl">{icon}</span>
        {title}
      </h3>

      {/* Summary (Always Visible) */}
      <div className={`${colors.summaryBg} rounded-lg p-4 md:p-6 mb-4 border ${colors.summaryBorder}`}>
        {summary}
      </div>

      {/* Expand/Collapse Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${colors.button}`}
        >
          <span>{isExpanded ? 'Hide' : 'Show'} Full Analysis</span>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Full Content (Collapsible) */}
      {isExpanded && (
        <div className="animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
