'use client';

import { useState } from 'react';
import { formatCost } from '@/lib/results-utils';
import CoverageScoreMeter from './CoverageScoreMeter';
import InsuranceText from '@/components/InsuranceText';
import { CostRange } from '@/types';

interface CollapsibleHeroSummaryProps {
  coverageGapScore: number;
  recommendedInsurance: string;
  householdBreakdown: string;
  estimatedMonthlyCost: CostRange;
  reasoning: string;
}

export default function CollapsibleHeroSummary({
  coverageGapScore,
  recommendedInsurance,
  householdBreakdown,
  estimatedMonthlyCost,
  reasoning,
}: CollapsibleHeroSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
    <div className="glass-hero rounded-3xl mb-8 md:mb-12 overflow-hidden shadow-glass-premium animate-bouncy-entrance">
      {/* Specular highlights */}
      <div className="specular-highlight"></div>

      {/* Collapsed State */}
      {!isExpanded && (
        <button
          onClick={(e) => {
            handleRipple(e);
            setIsExpanded(true);
          }}
          className="w-full p-6 md:p-8 text-left ripple-container morph-scale hover:bg-white/10 transition-all duration-300"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
              {/* Mini Score Badge with Premium Glass Effect */}
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full glass-card-accent flex items-center justify-center badge-float shadow-glass-premium">
                  <div className="number-premium text-accent text-xl md:text-2xl font-bold text-depth-sm">
                    {coverageGapScore}
                  </div>
                </div>
                {/* Enhanced glow ring */}
                <div className="absolute inset-0 rounded-full glow-color-matched blur-xl -z-10 glass-pulse"></div>
              </div>

              {/* Summary Info */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 badge-premium badge-pulse px-3 py-1 rounded-full text-xs md:text-sm font-bold mb-2 shadow-glass">
                  <span className="text-sm">✨</span>
                  <span className="text-gradient">YOUR RECOMMENDATION</span>
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 truncate mb-1 text-depth-md">
                  {recommendedInsurance}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-2xl md:text-4xl font-bold text-gradient-jewel text-depth-sm number-premium">
                    {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Expand button with enhanced glass effect */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full glass-button flex items-center justify-center morph-scale shadow-glass-premium">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="p-6 md:p-10 lg:p-12">
          {/* Collapse Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={(e) => {
                handleRipple(e);
                setIsExpanded(false);
              }}
              className="w-12 h-12 rounded-full glass-button ripple-container flex items-center justify-center morph-scale shadow-glass-premium spring-bouncy"
              aria-label="Collapse summary"
            >
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center">
            {/* Coverage Score with Enhanced Glass Effect */}
            <div className="flex-shrink-0 mx-auto lg:mx-0 relative animate-slideUpGlass" style={{animationDelay: '100ms'}}>
              <div className="glass-float">
                <CoverageScoreMeter score={coverageGapScore} />
              </div>
              {/* Enhanced animated glow effect */}
              <div className="absolute inset-0 rounded-full glow-color-matched blur-3xl -z-10 badge-pulse"></div>
            </div>

            {/* Main Recommendation */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 badge-premium badge-pulse px-5 py-2 rounded-full text-sm font-bold mb-4 shadow-glass-premium animate-slideUpGlass" style={{animationDelay: '200ms'}}>
                <span className="text-lg">🎯</span>
                <span className="text-gradient">
                  RECOMMENDED FOR YOU
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight text-depth-lg animate-slideUpGlass" style={{animationDelay: '300ms'}}>
                <InsuranceText text={recommendedInsurance} position="bottom" />
              </h2>

              <p className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed text-depth-sm animate-slideUpGlass" style={{animationDelay: '400ms'}}>
                <InsuranceText text={householdBreakdown} position="bottom" />
              </p>

              {/* Cost Display with Premium Glass Effect */}
              <div className="inline-flex items-baseline gap-3 glass-card px-6 py-4 rounded-2xl shadow-glass-premium morph-scale animate-slideUpGlass" style={{animationDelay: '500ms'}}>
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-jewel text-depth-lg number-premium">
                  {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
                </div>
                <div className="text-xl md:text-2xl text-gray-600 font-semibold text-depth-sm">
                  /month
                </div>
              </div>
            </div>
          </div>

          {/* Why This Recommendation - Premium Glass Card */}
          <div className="mt-8 lg:mt-10 pt-8 border-t border-white/30">
            <div className="glass-card-accent rounded-2xl p-6 md:p-8 shadow-glass-premium card-lift animate-slideUpGlass" style={{animationDelay: '600ms'}}>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3 text-depth-md">
                <span className="text-2xl">💡</span>
                <span>Why This Recommendation?</span>
              </h3>
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                {reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
