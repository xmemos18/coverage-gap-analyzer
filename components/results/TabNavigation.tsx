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
    <div className="glass-card rounded-3xl mb-8 overflow-hidden animate-slideUpGlass">
      {/* Tab Navigation with Liquid Glass */}
      <div className="relative border-b border-white/20">
        {/* Left scroll button (mobile) */}
        {showLeftScroll && (
          <button
            onClick={() => scrollTabs('left')}
            className="md:hidden absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-white/90 via-white/70 to-transparent backdrop-blur-sm px-2 flex items-center"
            aria-label="Scroll tabs left"
          >
            <div className="glass-button rounded-full shadow-lg p-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        )}

        {/* Tabs container */}
        <div
          ref={tabsRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto glass-scrollbar scroll-smooth"
        >
          <div className="flex gap-2 md:gap-3 p-3 md:p-4 min-w-max md:min-w-0 md:w-full md:justify-center">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative px-5 md:px-7 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-base
                  transition-all duration-300 whitespace-nowrap flex items-center gap-2 md:gap-3
                  ${activeTab === tab.id
                    ? 'glass-tab-active text-white scale-105 shadow-2xl'
                    : 'glass-tab text-gray-700 hover:scale-105 hover:shadow-lg'
                  }
                `}
              >
                <span className="text-lg md:text-2xl drop-shadow-sm">{tab.icon}</span>
                <span className="hidden sm:inline font-semibold">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`
                    ml-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-md
                    transition-all duration-300
                    ${activeTab === tab.id
                      ? 'glass-badge text-accent scale-110'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
                {/* Active indicator glow */}
                {activeTab === tab.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 blur-xl -z-10"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right scroll button (mobile) */}
        {showRightScroll && (
          <button
            onClick={() => scrollTabs('right')}
            className="md:hidden absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-white/90 via-white/70 to-transparent backdrop-blur-sm px-2 flex items-center"
            aria-label="Scroll tabs right"
          >
            <div className="glass-button rounded-full shadow-lg p-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Tab Content with Glass Background */}
      <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-white/40 to-blue-50/30">
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
