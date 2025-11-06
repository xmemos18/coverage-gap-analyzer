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
    bg: 'glass-card',
    glow: 'from-blue-400/20 to-blue-600/20',
    button: 'glass-button text-blue-700 hover:text-blue-900',
    accent: 'text-blue-600',
  },
  orange: {
    bg: 'glass-card',
    glow: 'from-orange-400/20 to-yellow-600/20',
    button: 'glass-button text-orange-700 hover:text-orange-900',
    accent: 'text-orange-600',
  },
  green: {
    bg: 'glass-card',
    glow: 'from-green-400/20 to-emerald-600/20',
    button: 'glass-button text-green-700 hover:text-green-900',
    accent: 'text-green-600',
  },
  purple: {
    bg: 'glass-card',
    glow: 'from-purple-400/20 to-pink-600/20',
    button: 'glass-button text-purple-700 hover:text-purple-900',
    accent: 'text-purple-600',
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

  // Ripple effect handler
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const iconColors = {
    blue: 'icon-cyan',
    orange: 'icon-gold',
    green: 'icon-green',
    purple: 'icon-purple',
  };

  return (
    <div className="mb-8 glass-card rounded-3xl p-6 md:p-8 fade-in">
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`${iconColors[colorScheme]} w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <h3 className="card-title text-2xl md:text-3xl flex-1">
          {title}
        </h3>
      </div>

      {/* Summary (Always Visible) */}
      <div className="glass-card-static rounded-2xl p-5 md:p-7 mb-6">
        {summary}
      </div>

      {/* Expand/Collapse Button with Ripple */}
      <div className="flex justify-center mb-4">
        <button
          onClick={(e) => {
            handleRipple(e);
            setIsExpanded(!isExpanded);
          }}
          className="btn-secondary px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ripple-container"
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
        <div className="mt-6 slide-up">
          <div className="glass-card-static rounded-2xl p-5 md:p-7">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
