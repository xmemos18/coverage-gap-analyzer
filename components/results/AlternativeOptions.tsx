'use client';

import { memo, useRef, useState, useEffect } from 'react';
import { formatCost } from '@/lib/results-utils';
import InsuranceText from '@/components/InsuranceText';
import { AlternativeOption } from '@/types';

interface AlternativeOptionsProps {
  options: AlternativeOption[];
}

function AlternativeOptions({ options }: AlternativeOptionsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 10);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (options.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span className="text-3xl">🔍</span>
          Other Options to Consider
        </h3>
        <p className="text-gray-600">Alternative plans that might work for your situation</p>
      </div>

      {/* Mobile: Horizontal Scroll Carousel */}
      <div className="md:hidden relative">
        {showLeftScroll && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {options.map((option, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-80 snap-center"
            >
              <OptionCard
                option={option}
                isExpanded={expandedIndex === index}
                onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
              />
            </div>
          ))}
        </div>

        {showRightScroll && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {options.map((option, index) => (
          <OptionCard
            key={index}
            option={option}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

// Separate component for each option card
interface OptionCardProps {
  option: AlternativeOption;
  isExpanded: boolean;
  onToggle: () => void;
}

function OptionCard({ option, isExpanded, onToggle }: OptionCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200 hover:border-accent transition-all h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <h4 className="text-xl font-bold text-gray-900 mb-3">
          <InsuranceText text={option.name} position="bottom" />
        </h4>
        <div className="flex items-baseline gap-2 mb-1">
          <div className="text-3xl font-bold text-accent">
            {formatCost(option.monthlyCost.low, option.monthlyCost.high)}
          </div>
          <div className="text-sm text-gray-600">/month</div>
        </div>
      </div>

      {/* Pros (Always Visible) */}
      <div className="px-6 pb-4 flex-1">
        <h5 className="font-semibold text-success mb-2 flex items-center gap-2 text-sm">
          <span>✓</span> Key Benefits
        </h5>
        <ul className="space-y-1">
          {option.pros.slice(0, 3).map((pro, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-success flex-shrink-0 mt-1">•</span>
              <span><InsuranceText text={pro} position="bottom" /></span>
            </li>
          ))}
          {option.pros.length > 3 && !isExpanded && (
            <li className="text-sm text-gray-500 italic">
              +{option.pros.length - 3} more...
            </li>
          )}
          {isExpanded && option.pros.slice(3).map((pro, i) => (
            <li key={i + 3} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-success flex-shrink-0 mt-1">•</span>
              <span><InsuranceText text={pro} position="bottom" /></span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons (Expandable) */}
      {isExpanded && (
        <div className="px-6 pb-4 animate-fadeIn">
          <h5 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm">
            <span>−</span> Considerations
          </h5>
          <ul className="space-y-1">
            {option.cons.map((con, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 flex-shrink-0 mt-1">•</span>
                <span><InsuranceText text={con} position="bottom" /></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* View More/Less Button */}
      <div className="p-4 pt-0 mt-auto">
        <button
          onClick={onToggle}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>{isExpanded ? 'Show Less' : 'View Details'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(AlternativeOptions);
