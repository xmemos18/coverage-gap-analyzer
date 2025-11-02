'use client';

import { useState, useRef, useEffect } from 'react';
import { getGlossaryTerm } from '@/lib/insuranceGlossary';

interface InsuranceTooltipProps {
  term: string; // Key from insuranceGlossary
  children: React.ReactNode; // The text to underline/highlight
  className?: string;
}

export default function InsuranceTooltip({ term, children, className = '' }: InsuranceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFullDefinition, setShowFullDefinition] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const glossaryTerm = getGlossaryTerm(term);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowFullDefinition(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // If term not found, render children without tooltip
  if (!glossaryTerm) {
    return <span className={className}>{children}</span>;
  }

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowFullDefinition(false);
    }
  };

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <span
        ref={triggerRef}
        onClick={handleToggle}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => {
          // Only close on mouse leave if not showing full definition
          if (!showFullDefinition) {
            setIsOpen(false);
          }
        }}
        className="text-accent font-medium underline decoration-dotted decoration-2 underline-offset-2 cursor-help transition-colors hover:text-accent-light"
        role="button"
        tabIndex={0}
        aria-label={`Definition of ${glossaryTerm.term}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        {children}
      </span>

      {/* Tooltip */}
      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 mt-2 w-80 max-w-[90vw] bg-white border-2 border-accent rounded-lg shadow-2xl p-4 animate-in fade-in duration-200"
          role="tooltip"
          aria-live="polite"
        >
          {/* Arrow pointer */}
          <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l-2 border-t-2 border-accent rotate-45" />

          {/* Term name */}
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-lg font-bold text-gray-900">{glossaryTerm.term}</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 ml-2"
              aria-label="Close tooltip"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Short definition */}
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">
            {glossaryTerm.shortDefinition}
          </p>

          {/* Long definition (expandable) */}
          {!showFullDefinition ? (
            <button
              onClick={() => setShowFullDefinition(true)}
              className="text-accent text-sm font-semibold hover:underline"
            >
              Learn more →
            </button>
          ) : (
            <div className="space-y-3">
              {/* Full explanation */}
              <p className="text-gray-700 text-sm leading-relaxed">
                {glossaryTerm.longDefinition}
              </p>

              {/* Analogy */}
              {glossaryTerm.analogy && (
                <div className="bg-blue-50 border-l-4 border-accent p-3 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-accent">Think of it like this:</span> {glossaryTerm.analogy}
                  </p>
                </div>
              )}

              {/* Example */}
              {glossaryTerm.example && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-green-700">Example:</span> {glossaryTerm.example}
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowFullDefinition(false)}
                className="text-accent text-sm font-semibold hover:underline"
              >
                ← Show less
              </button>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
