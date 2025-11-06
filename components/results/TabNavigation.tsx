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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Ripple effect handler
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

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

    // Dynamic blur on page scroll
    let scrollTimeout: NodeJS.Timeout;
    const handlePageScroll = () => {
      setIsScrolling(true);
      if (containerRef.current) {
        containerRef.current.classList.add('scrolling');
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        if (containerRef.current) {
          containerRef.current.classList.remove('scrolling');
        }
      }, 150);
    };

    window.addEventListener('scroll', handlePageScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
      window.removeEventListener('scroll', handlePageScroll);
      clearTimeout(scrollTimeout);
    };
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
    <div ref={containerRef} className="glass-card rounded-3xl mb-8 overflow-hidden bounce-in">
      {/* Tab Navigation with Dark Liquid Glass */}
      <div className="relative border-b border-white/10">
        {/* Left scroll button (mobile) */}
        {showLeftScroll && (
          <button
            onClick={(e) => {
              handleRipple(e);
              scrollTabs('left');
            }}
            className="md:hidden absolute left-0 top-0 bottom-0 z-50 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent px-2 flex items-center ripple-container"
            aria-label="Scroll tabs left"
          >
            <div className="btn-secondary rounded-full p-2">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={(e) => {
                  handleRipple(e);
                  onTabChange(tab.id);
                }}
                className={`
                  relative px-5 md:px-7 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-base
                  transition-all duration-300 whitespace-nowrap flex items-center gap-2 md:gap-3
                  ripple-container fade-in
                  ${activeTab === tab.id
                    ? 'glass-tab-active'
                    : 'glass-tab'
                  }
                `}
                style={{animationDelay: `${idx * 50}ms`}}
              >
                <span className="text-lg md:text-2xl drop-shadow-sm">{tab.icon}</span>
                <span className="hidden sm:inline font-semibold">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`
                    ml-1 px-2.5 py-1 rounded-full text-xs font-bold
                    transition-all duration-300
                    ${activeTab === tab.id
                      ? 'badge-gold'
                      : 'badge-cyan'
                    }
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
            onClick={(e) => {
              handleRipple(e);
              scrollTabs('right');
            }}
            className="md:hidden absolute right-0 top-0 bottom-0 z-50 bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent px-2 flex items-center ripple-container"
            aria-label="Scroll tabs right"
          >
            <div className="btn-secondary rounded-full p-2">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Tab Content with Dark Glass Background */}
      <div className="p-4 md:p-6 lg:p-8">
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
