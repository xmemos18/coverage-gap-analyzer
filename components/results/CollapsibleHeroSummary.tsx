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
    <div className="glass-hero rounded-3xl mb-8 md:mb-12 overflow-hidden bounce-in">
      {/* Collapsed State */}
      {!isExpanded && (
        <button
          onClick={(e) => {
            handleRipple(e);
            setIsExpanded(true);
          }}
          className="w-full p-6 md:p-8 text-left ripple-container hover:bg-white/5 transition-all duration-300"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
              {/* Mini Score Badge with Bold Glass Effect */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl icon-coral flex items-center justify-center">
                  <div className="text-white text-xl md:text-2xl font-bold">
                    {coverageGapScore}
                  </div>
                </div>
              </div>

              {/* Summary Info */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 badge-cyan px-3 py-1 rounded-full text-xs md:text-sm mb-2">
                  <span className="text-sm">✨</span>
                  <span>YOUR RECOMMENDATION</span>
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-white truncate mb-1">
                  {recommendedInsurance}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-2xl md:text-4xl font-bold text-gradient-multicolor">
                    {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Expand button with glass effect */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full btn-secondary flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="w-12 h-12 rounded-full btn-secondary ripple-container flex items-center justify-center"
              aria-label="Collapse summary"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center">
            {/* Coverage Score */}
            <div className="flex-shrink-0 mx-auto lg:mx-0 slide-up" style={{animationDelay: '100ms'}}>
              <CoverageScoreMeter score={coverageGapScore} />
            </div>

            {/* Main Recommendation */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 badge-gold px-5 py-2 rounded-full text-sm mb-4 slide-up" style={{animationDelay: '200ms'}}>
                <span className="text-lg">🎯</span>
                <span>
                  RECOMMENDED FOR YOU
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight slide-up" style={{animationDelay: '300ms'}}>
                <InsuranceText text={recommendedInsurance} position="bottom" />
              </h2>

              <p className="text-lg md:text-xl body-text mb-6 leading-relaxed slide-up" style={{animationDelay: '400ms'}}>
                <InsuranceText text={householdBreakdown} position="bottom" />
              </p>

              {/* Cost Display with Bold Gradient */}
              <div className="inline-flex items-baseline gap-3 glass-card-static px-6 py-4 rounded-2xl slide-up" style={{animationDelay: '500ms'}}>
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-coral-cyan">
                  {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
                </div>
                <div className="text-xl md:text-2xl text-white font-semibold">
                  /month
                </div>
              </div>
            </div>
          </div>

          {/* Why This Recommendation - Glass Card */}
          <div className="mt-8 lg:mt-10 pt-8 border-t border-white/20">
            <div className="glass-card rounded-2xl p-6 md:p-8 slide-up" style={{animationDelay: '600ms'}}>
              <h3 className="card-title mb-4 flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <span>Why This Recommendation?</span>
              </h3>
              <p className="body-text leading-relaxed">
                {reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
