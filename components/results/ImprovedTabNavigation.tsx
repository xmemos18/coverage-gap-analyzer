'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

export type TabId = 'summary' | 'costs' | 'alternatives' | 'specialized' | 'addons' | 'steps';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  badge?: number;
  ariaLabel?: string;
}

interface ImprovedTabNavigationProps {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  children: ReactNode;
  stickyOffset?: number;
}

export function ImprovedTabNavigation({
  tabs,
  activeTab,
  onTabChange,
  children,
  stickyOffset = 64, // Height of ResultsHeader
}: ImprovedTabNavigationProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check scroll position
  const checkScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftScroll(scrollLeft > 10);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      container?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [tabs]);

  // Scroll tabs container
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, tabId: TabId) => {
    const currentIndex = tabs.findIndex(t => t.id === tabId);

    if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
      e.preventDefault();
      onTabChange(tabs[currentIndex + 1].id);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault();
      onTabChange(tabs[currentIndex - 1].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onTabChange(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onTabChange(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div className="mb-6 md:mb-8 print:mb-0">
      {/* Sticky Tab Bar */}
      <div
        className="sticky z-40 bg-white border-b border-gray-200 print:hidden shadow-sm"
        style={{ top: `${stickyOffset}px` }}
      >
        <div className="relative">
          {/* Left Scroll Button (Mobile) */}
          {showLeftScroll && (
            <button
              onClick={() => scrollTabs('left')}
              className="md:hidden absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-white via-white to-transparent px-2 flex items-center"
              aria-label="Scroll tabs left"
            >
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-md tap-highlight">
                <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>
          )}

          {/* Tabs Container */}
          <div
            ref={tabsContainerRef}
            className="overflow-x-auto custom-scrollbar scroll-smooth"
            role="tablist"
            aria-label="Insurance recommendation sections"
          >
            <div className="flex gap-1 md:gap-2 p-2 min-w-max md:justify-center">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, tab.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tab.id}-panel`}
                    aria-label={tab.ariaLabel || `${tab.label} section`}
                    tabIndex={isActive ? 0 : -1}
                    className={`
                      relative flex items-center gap-2 px-4 md:px-6 py-3
                      font-semibold text-sm md:text-base whitespace-nowrap
                      rounded-lg transition-all duration-200
                      touch-target tap-highlight focus-ring
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }
                    `}
                  >
                    {/* Icon */}
                    <span className="text-lg md:text-xl" aria-hidden="true">
                      {tab.icon}
                    </span>

                    {/* Label - Show on larger screens */}
                    <span className="hidden sm:inline">
                      {tab.label}
                    </span>

                    {/* Badge */}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`
                          ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                          ${isActive
                            ? 'bg-white bg-opacity-20'
                            : 'bg-blue-600 text-white'
                          }
                        `}
                        aria-label={`${tab.badge} items`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Scroll Button (Mobile) */}
          {showRightScroll && (
            <button
              onClick={() => scrollTabs('right')}
              className="md:hidden absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-white via-white to-transparent px-2 flex items-center"
              aria-label="Scroll tabs right"
            >
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-md tap-highlight">
                <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6 md:mt-8">
        {children}
      </div>
    </div>
  );
}

// Tab Panel Component
interface TabPanelProps {
  value: TabId;
  activeTab: TabId;
  children: ReactNode;
}

export function TabPanel({ value, activeTab, children }: TabPanelProps) {
  if (value !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      id={`${value}-panel`}
      aria-labelledby={`${value}-tab`}
      className="fade-in"
    >
      {children}
    </div>
  );
}
