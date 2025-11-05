'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

export type TabId = 'summary' | 'analysis' | 'costs' | 'alternatives' | 'specialized' | 'addons' | 'steps';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  badge?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  children: ReactNode;
}

export function TabNavigation({ tabs, activeTab, onTabChange, children }: TabNavigationProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check scroll position for mobile
  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
      {/* Tab Navigation */}
      <div className="relative border-b border-gray-200">
        {/* Left scroll button (mobile) */}
        {showLeftScroll && (
          <button
            onClick={() => scrollTabs('left')}
            className="md:hidden absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-white to-transparent px-2 flex items-center"
            aria-label="Scroll tabs left"
          >
            <div className="bg-white rounded-full shadow-md p-1">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        )}

        {/* Tabs container */}
        <div
          ref={tabsRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-1 md:gap-2 p-2 min-w-max md:min-w-0 md:w-full md:justify-center">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative px-4 md:px-6 py-3 rounded-lg font-semibold text-sm md:text-base
                  transition-all duration-200 whitespace-nowrap flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'bg-accent text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-lg md:text-xl">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                    ${activeTab === tab.id ? 'bg-white text-accent' : 'bg-accent text-white'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right scroll button (mobile) */}
        {showRightScroll && (
          <button
            onClick={() => scrollTabs('right')}
            className="md:hidden absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-white to-transparent px-2 flex items-center"
            aria-label="Scroll tabs right"
          >
            <div className="bg-white rounded-full shadow-md p-1">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

// Tab Panel component for easy content organization
interface TabPanelProps {
  value: TabId;
  activeTab: TabId;
  children: ReactNode;
}

export function TabPanel({ value, activeTab, children }: TabPanelProps) {
  if (value !== activeTab) return null;

  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
}
