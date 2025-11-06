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
  const colors = colorClasses[colorScheme];

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

  return (
    <div className={`mb-8 ${colors.bg} rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-glass-premium card-lift animate-bouncy-entrance`}>
      {/* Specular highlights */}
      <div className="specular-highlight"></div>

      {/* Enhanced decorative glow */}
      <div className={`absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br ${colors.glow} rounded-full blur-3xl opacity-40 glass-pulse`}></div>

      {/* Header with Premium Effects */}
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3 relative z-cards text-depth-lg">
        <span className="text-3xl md:text-4xl drop-shadow-sm">{icon}</span>
        <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          {title}
        </span>
      </h3>

      {/* Summary (Always Visible) - Premium Glass Card */}
      <div className="glass-card-accent rounded-2xl p-5 md:p-7 mb-6 relative z-cards shadow-glass card-lift">
        {summary}
      </div>

      {/* Expand/Collapse Button with Ripple */}
      <div className="flex justify-center mb-4 relative z-cards">
        <button
          onClick={(e) => {
            handleRipple(e);
            setIsExpanded(!isExpanded);
          }}
          className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${colors.button} morph-scale shadow-glass-premium spring-bouncy ripple-container`}
        >
          <span className="text-depth-sm">{isExpanded ? 'Hide' : 'Show'} Full Analysis</span>
          <svg
            className={`w-5 h-5 transition-transform duration-300 spring-bouncy ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expandable Content with Staggered Animation */}
      {isExpanded && (
        <div className="mt-6 relative z-cards animate-bouncy-entrance">
          <div className="glass-card rounded-2xl p-5 md:p-7 shadow-glass-premium">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
