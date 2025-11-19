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
        if (section?.element) {
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
      {/* Premium Desktop: Sidebar Navigation */}
      <nav className="hidden lg:block fixed left-4 top-24 z-40 print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-5 max-w-[220px]">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="text-blue-600">🗂️</span>
            Jump to
          </h3>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300
                    flex items-center gap-3 border-2
                    ${activeSection === section.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg border-blue-600 scale-105'
                      : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-200 hover:shadow-md'
                    }
                  `}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="truncate">{section.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Premium Mobile: Bottom Navigation */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50 print:hidden">
        {/* Premium Expandable Menu */}
        {isExpanded && (
          <>
            {/* Premium Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fadeIn"
              onClick={() => setIsExpanded(false)}
            />

            {/* Premium Menu */}
            <div className="fixed bottom-24 right-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border-2 border-gray-200 p-4 w-72 max-h-[60vh] overflow-y-auto animate-fadeIn">
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-200">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-blue-600">🗂️</span>
                  Jump to Section
                </h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-500 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`
                        w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300
                        flex items-center gap-3 border-2
                        ${activeSection === section.id
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg border-blue-600'
                          : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-200 hover:shadow-md'
                        }
                      `}
                    >
                      <span className="text-xl">{section.icon}</span>
                      <span>{section.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Premium Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 hover:scale-110 border-2 border-white"
          aria-label="Navigation menu"
        >
          {isExpanded ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
