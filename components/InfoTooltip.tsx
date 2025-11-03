'use client';

import { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * InfoTooltip - Displays an info icon that shows helpful text on hover
 * Used throughout forms to explain why we collect certain information
 */
export default function InfoTooltip({ content, position = 'top', className = '' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Position classes for tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow classes for tooltip
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) {
      setIsVisible(!isVisible);
    }
  };

  return (
    <div className={`inline-block relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 ml-1.5 text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full transition-colors"
        onMouseEnter={() => !isMobile && setIsVisible(true)}
        onMouseLeave={() => !isMobile && setIsVisible(false)}
        onClick={handleToggle}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="More information"
        aria-describedby={isVisible ? 'tooltip-content' : undefined}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Tooltip content */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip-content"
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]} w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none`}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
