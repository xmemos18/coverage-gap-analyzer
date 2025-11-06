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
    icon: 'icon-blue',
  },
  orange: {
    icon: 'icon-blue',
  },
  green: {
    icon: 'icon-green',
  },
  purple: {
    icon: 'icon-blue',
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

  return (
    <div className="mb-8 card fade-in">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`${colorClasses[colorScheme].icon} w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <h3 className="heading-3 flex-1">
          {title}
        </h3>
      </div>

      {/* Summary (Always Visible) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 md:p-6 mb-6">
        {summary}
      </div>

      {/* Expand/Collapse Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-secondary px-6 py-3 font-semibold transition-all flex items-center gap-2"
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

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-6 fade-in">
          <div className="bg-white border border-gray-200 rounded-lg p-5 md:p-6">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
