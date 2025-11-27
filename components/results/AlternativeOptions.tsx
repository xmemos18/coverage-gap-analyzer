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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-dark-800 dark:to-dark-700 border-2 border-gray-200 dark:border-dark-600 shadow-2xl p-6 md:p-8 mb-12 md:mb-16">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      <div className="relative mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-3xl md:text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
            🔍
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Other Options to Consider
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Alternative plans that might work for your situation</p>
          </div>
        </div>
      </div>

      {/* Premium Mobile: Horizontal Scroll Carousel */}
      <div className="md:hidden relative">
        {showLeftScroll && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-xl p-3 hover:scale-110 transition-transform duration-300"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
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
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-xl p-3 hover:scale-110 transition-transform duration-300"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
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
    <div className="group relative bg-gradient-to-br from-white via-gray-50 to-white dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 rounded-2xl border-2 border-gray-200 dark:border-dark-600 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] group-hover:opacity-[0.03] dark:group-hover:opacity-[0.07] transition-opacity"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}
      ></div>

      {/* Premium Header */}
      <div className="relative p-6 pb-4 border-b-2 border-gray-100 dark:border-dark-600">
        <h4 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
          <InsuranceText text={option.name} position="bottom" />
        </h4>
        <div className="flex items-baseline gap-2 mb-1">
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-500 bg-clip-text text-transparent">
            {formatCost(option.monthlyCost.low, option.monthlyCost.high)}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">/month</div>
        </div>
      </div>

      {/* Premium Pros (Always Visible) */}
      <div className="relative px-6 pt-4 pb-4 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm shadow-md rotate-3">
            ✓
          </div>
          <h5 className="font-bold text-green-900 dark:text-green-200 text-base">Key Benefits</h5>
        </div>
        <ul className="space-y-2">
          {option.pros.slice(0, 3).map((pro, i) => (
            <li key={i} className="text-sm text-gray-800 dark:text-gray-200 flex items-start gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="flex-1 leading-relaxed"><InsuranceText text={pro} position="bottom" /></span>
            </li>
          ))}
          {option.pros.length > 3 && !isExpanded && (
            <li className="text-sm text-blue-600 dark:text-blue-400 font-semibold italic pl-7">
              +{option.pros.length - 3} more benefit{option.pros.length - 3 !== 1 ? 's' : ''}...
            </li>
          )}
          {isExpanded && option.pros.slice(3).map((pro, i) => (
            <li key={i + 3} className="text-sm text-gray-800 dark:text-gray-200 flex items-start gap-2.5 animate-fadeIn">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 4}
              </span>
              <span className="flex-1 leading-relaxed"><InsuranceText text={pro} position="bottom" /></span>
            </li>
          ))}
        </ul>
      </div>

      {/* Premium Cons (Expandable) */}
      {isExpanded && (
        <div className="relative px-6 pb-4 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white text-lg shadow-md rotate-3">
              ⚠
            </div>
            <h5 className="font-bold text-orange-900 dark:text-orange-200 text-base">Considerations</h5>
          </div>
          <ul className="space-y-2">
            {option.cons.map((con, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="flex-1 leading-relaxed"><InsuranceText text={con} position="bottom" /></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Premium Toggle Button */}
      <div className="relative p-4 pt-0 mt-auto">
        <button
          onClick={onToggle}
          className="group/btn w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-dark-700 dark:to-dark-600 hover:from-blue-600 hover:to-indigo-700 text-gray-700 dark:text-gray-200 hover:text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-dark-500 hover:border-blue-600 shadow-sm hover:shadow-md"
        >
          <span>{isExpanded ? 'Show Less' : 'View Details'}</span>
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
    </div>
  );
}

export default memo(AlternativeOptions);
