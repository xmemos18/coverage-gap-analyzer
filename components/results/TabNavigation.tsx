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
    <div ref={containerRef} className="glass-card rounded-3xl mb-8 overflow-hidden animate-bouncy-entrance shadow-glass-premium blur-dynamic">
      {/* Specular highlights */}
      <div className="specular-highlight"></div>

      {/* Tab Navigation with Premium Liquid Glass */}
      <div className="relative border-b border-white/20">
        {/* Left scroll button (mobile) */}
        {showLeftScroll && (
          <button
            onClick={(e) => {
              handleRipple(e);
              scrollTabs('left');
            }}
            className="md:hidden absolute left-0 top-0 bottom-0 z-navigation bg-gradient-to-r from-white/90 via-white/70 to-transparent backdrop-blur-sm px-2 flex items-center ripple-container"
            aria-label="Scroll tabs left"
          >
            <div className="glass-button rounded-full shadow-glass-premium p-2 morph-scale">
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
                  ripple-container spring-bouncy animate-slideUpGlass
                  ${activeTab === tab.id
                    ? 'glass-tab-active text-white scale-105 shadow-glass-premium'
                    : 'glass-tab text-gray-700 morph-scale card-lift'
                  }
                `}
                style={{animationDelay: `${idx * 50}ms`}}
              >
                <span className="text-lg md:text-2xl drop-shadow-sm">{tab.icon}</span>
                <span className="hidden sm:inline font-semibold text-depth-sm">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`
                    ml-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-glass
                    transition-all duration-300 number-premium
                    ${activeTab === tab.id
                      ? 'badge-premium text-gradient badge-pulse'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
                {/* Enhanced active indicator glow */}
                {activeTab === tab.id && (
                  <div className="absolute inset-0 rounded-2xl glow-color-matched blur-xl -z-10 badge-pulse"></div>
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
            className="md:hidden absolute right-0 top-0 bottom-0 z-navigation bg-gradient-to-l from-white/90 via-white/70 to-transparent backdrop-blur-sm px-2 flex items-center ripple-container"
            aria-label="Scroll tabs right"
          >
            <div className="glass-button rounded-full shadow-glass-premium p-2 morph-scale">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Tab Content with Premium Glass Background */}
      <div className="p-4 md:p-6 lg:p-8 pastel-overlay relative z-cards">
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
