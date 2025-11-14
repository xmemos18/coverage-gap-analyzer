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
    <div className="mb-12 md:mb-16 animate-fadeIn">
      {/* Premium Header with Icon */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.iconBg} text-3xl md:text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">
          {title}
        </h3>
      </div>

      {/* Premium Summary Card */}
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colors.summaryGradient} border-2 ${colors.summaryBorder} p-5 md:p-6 mb-6 shadow-md`}>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        ></div>
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
          <div className="relative overflow-hidden rounded-xl bg-white border-2 border-gray-200 p-5 md:p-6 shadow-lg">
            <div
              className="absolute inset-0 opacity-[0.01]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
                backgroundSize: '30px 30px'
              }}
            ></div>
            <div className="relative">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
