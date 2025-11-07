'use client';

import { useState, ReactNode } from 'react';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  className?: string;
}

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  icon = null,
  className = '',
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const accordionId = `accordion-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`border-b border-gray-200 last:border-0 ${className}`}>
      <button
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors rounded-lg px-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={accordionId}
      >
        <span className="font-semibold text-gray-900 flex items-center gap-3">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{title}</span>
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div id={accordionId} className="pb-4 pt-2 px-2 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

// Multi-Accordion Container Component
interface AccordionGroupProps {
  children: ReactNode;
  allowMultiple?: boolean;
  className?: string;
}

export function AccordionGroup({ children, className = '' }: AccordionGroupProps) {
  return (
    <div className={`divide-y divide-gray-200 border-y border-gray-200 ${className}`}>
      {children}
    </div>
  );
}
