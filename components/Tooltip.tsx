'use client';

import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  example?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Accessible tooltip component with keyboard support
 * Shows help text on hover, focus, and click
 */
export default function Tooltip({
  content,
  example,
  children,
  position = 'top'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(true);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  const toggleTooltip = () => {
    setIsVisible(!isVisible);
  };

  // Handle Escape key to close tooltip
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
        triggerRef.current?.focus();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible]);

  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
  };

  return (
    <span className="relative inline-block">
      <span
        ref={triggerRef}
        onMouseEnter={isMobile ? undefined : showTooltip}
        onMouseLeave={isMobile ? undefined : hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={isMobile ? toggleTooltip : undefined}
        className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-blue-600 hover:border-solid focus:outline-none focus:border-solid transition-all"
        tabIndex={0}
        role="button"
        aria-describedby={isVisible ? tooltipId : undefined}
        aria-expanded={isVisible}
      >
        {children}
        <span className="text-blue-600 text-xs font-bold" aria-hidden="true">
          ⓘ
        </span>
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 w-72 max-w-xs ${positionClasses[position]}`}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-4">
            <div className="font-medium mb-1">{content}</div>
            {example && (
              <div className="text-gray-300 text-xs mt-2 italic">
                {example}
              </div>
            )}
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </span>
  );
}
