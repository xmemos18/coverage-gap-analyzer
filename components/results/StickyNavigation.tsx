'use client';

import { useState, useEffect } from 'react';

interface NavigationSection {
  id: string;
  label: string;
  icon: string;
}

interface StickyNavigationProps {
  sections: NavigationSection[];
}

export default function StickyNavigation({ sections }: StickyNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navigation after scrolling past hero
      const scrolled = window.scrollY > 300;
      setIsVisible(scrolled);

      // Determine active section based on scroll position
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id),
      }));

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.offsetTop - 100;
      window.scrollTo({ top, behavior: 'smooth' });
      setIsExpanded(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Desktop: Sidebar Navigation */}
      <nav className="hidden lg:block fixed left-4 top-24 z-40 print:hidden">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 max-w-[200px]">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Jump to</h3>
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all
                    flex items-center gap-2
                    ${activeSection === section.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-base">{section.icon}</span>
                  <span className="truncate">{section.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile: Bottom Navigation */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50 print:hidden">
        {/* Expandable Menu */}
        {isExpanded && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsExpanded(false)}
            />

            {/* Menu */}
            <div className="fixed bottom-20 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 w-64 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase">Jump to Section</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        flex items-center gap-3
                        ${activeSection === section.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span>{section.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-2xl hover:bg-blue-700 transition-all hover:scale-110"
          aria-label="Navigation menu"
        >
          {isExpanded ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
