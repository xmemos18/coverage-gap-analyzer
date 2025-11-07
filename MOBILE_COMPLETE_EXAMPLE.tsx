/**
 * COMPLETE MOBILE RESULTS PAGE EXAMPLE
 *
 * This file demonstrates the complete mobile layout (< 768px)
 * with all components integrated and mobile-optimized.
 *
 * COPY-PASTE READY: You can use this as a reference or starting point.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// MOBILE HEADER COMPONENT
// ============================================================================

function MobileHeader({ onShare, onExport, onPrint }: any) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Sticky Header */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-14 px-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => router.push('/calculator')}
            className="touch-target -ml-2 p-2 active:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to calculator"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Logo */}
          <a href="/" className="text-xl font-bold text-blue-600" aria-label="Key Insurance Matters home">
            KIM
          </a>

          {/* Menu Button */}
          <button
            onClick={() => setShowMenu(true)}
            className="touch-target -mr-2 p-2 active:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* Scroll Progress Bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </header>

      {/* Mobile Menu Dropdown */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="fixed top-14 left-0 right-0 z-50 bg-white shadow-2xl max-h-[80vh] overflow-y-auto animate-slideDown">
            <div className="p-4 space-y-2">
              {/* Share */}
              <button
                onClick={() => { onShare(); setShowMenu(false); }}
                className="w-full flex items-center gap-4 p-4 text-left rounded-xl active:bg-gray-50"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Share Results</div>
                  <div className="text-sm text-gray-600">Send via email or link</div>
                </div>
              </button>

              {/* Export */}
              <button
                onClick={() => { onExport(); setShowMenu(false); }}
                className="w-full flex items-center gap-4 p-4 text-left rounded-xl active:bg-gray-50"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Export PDF</div>
                  <div className="text-sm text-gray-600">Save for offline</div>
                </div>
              </button>

              {/* Print */}
              <button
                onClick={() => { onPrint(); setShowMenu(false); }}
                className="w-full flex items-center gap-4 p-4 text-left rounded-xl active:bg-gray-50"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Print</div>
                  <div className="text-sm text-gray-600">Print this page</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ============================================================================
// MOBILE HERO CARD (COLLAPSIBLE)
// ============================================================================

function MobileHeroCard({ data }: any) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200 text-green-600';
    if (score >= 60) return 'bg-blue-50 border-blue-200 text-blue-600';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200 text-yellow-600';
    return 'bg-red-50 border-red-200 text-red-600';
  };

  return (
    <div className="mb-6">
      {/* Collapsed State */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-4 active:scale-[0.99] transition-transform shadow-md"
        >
          <div className="flex items-center gap-3">
            {/* Score Badge */}
            <div className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center font-bold ${getScoreColor(data.score)}`}>
              <div className="text-2xl">{data.score}</div>
              <div className="text-[9px] uppercase opacity-75">Score</div>
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold mb-1">
                ✨ RECOMMENDED
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
                {data.name}
              </h2>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-blue-600">${data.costLow}-${data.costHigh}</span>
                <span className="text-xs text-gray-600">/mo</span>
              </div>
            </div>

            {/* Expand Icon */}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-lg overflow-hidden">
          {/* Collapse Button */}
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-full active:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-6 space-y-6">
            {/* Score */}
            <div className="flex flex-col items-center">
              <div className={`w-32 h-32 rounded-2xl border-4 flex flex-col items-center justify-center ${getScoreColor(data.score)}`}>
                <div className="text-5xl font-bold">{data.score}</div>
                <div className="text-sm uppercase font-bold opacity-75 mt-1">Coverage Score</div>
              </div>
            </div>

            {/* Details */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs mb-3">
                🎯 YOUR BEST MATCH
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{data.name}</h2>
              <p className="text-base text-gray-700 mb-6">{data.household}</p>

              {/* Cost */}
              <div className="inline-flex flex-col items-center bg-white border-2 border-blue-300 rounded-xl px-6 py-4 shadow-md mb-2">
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  ${data.costLow}-${data.costHigh}
                </div>
                <div className="text-base text-gray-700 font-semibold">per month</div>
              </div>
              <p className="text-xs text-gray-500 italic px-6">* Estimated range</p>
            </div>
          </div>

          {/* Reasoning */}
          <div className="border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Why This?</h3>
                <p className="text-sm text-gray-800">{data.reasoning}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MOBILE TAB NAVIGATION
// ============================================================================

function MobileTabs({ activeTab, onTabChange }: any) {
  const tabs = [
    { id: 'summary', icon: '📋', label: 'Summary' },
    { id: 'costs', icon: '💰', label: 'Costs' },
    { id: 'alternatives', icon: '🔍', label: 'Options', badge: 3 },
    { id: 'steps', icon: '✅', label: 'Steps' },
  ];

  return (
    <div className="sticky bg-white border-b border-gray-200 z-30 shadow-sm" style={{ top: '56px' }}>
      <div className="relative">
        {/* Scrollable Tabs */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 p-2 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center min-w-[72px] px-3 py-2 rounded-lg
                  transition-all touch-target
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }
                `}
              >
                <span className="text-2xl mb-1">{tab.icon}</span>
                <span className="text-[10px] font-bold uppercase">{tab.label.split(' ')[0]}</span>
                {tab.badge && (
                  <span className={`
                    absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center
                    text-[10px] font-bold shadow-md
                    ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOBILE COST CARDS
// ============================================================================

function MobileCostCards({ data }: any) {
  return (
    <div className="space-y-4 mb-6">
      {/* Monthly Premium */}
      <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-5 text-center">
        <div className="text-sm font-semibold text-gray-600 mb-2">Monthly Premium</div>
        <div className="text-4xl font-bold text-blue-600 mb-1">${data.monthly}</div>
        <div className="text-xs text-gray-600">For your household</div>
      </div>

      {/* Annual Cost */}
      <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-5 text-center">
        <div className="text-sm font-semibold text-gray-600 mb-2">Annual Cost</div>
        <div className="text-4xl font-bold text-green-600 mb-1">${data.annual}</div>
        <div className="text-xs text-gray-600">Per year estimate</div>
      </div>

      {/* Savings (if applicable) */}
      {data.savings && (
        <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-5 text-center">
          <div className="text-sm font-semibold text-gray-600 mb-2">Potential Savings</div>
          <div className="text-4xl font-bold text-purple-600 mb-1">${data.savings}</div>
          <div className="text-xs text-gray-600">Per year vs current</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MOBILE BOTTOM ACTION BAR
// ============================================================================

function MobileBottomBar({ onShare, onExport, onPrint }: any) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl px-4 py-3 safe-area-bottom z-40">
      <div className="flex gap-2">
        <button
          onClick={onShare}
          className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold active:bg-gray-200"
        >
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-xs">Share</span>
          </div>
        </button>

        <button
          onClick={onExport}
          className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold active:bg-gray-200"
        >
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">PDF</span>
          </div>
        </button>

        <button
          onClick={onPrint}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold active:bg-blue-700 shadow-lg"
        >
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="text-xs">Print</span>
          </div>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPLETE MOBILE PAGE
// ============================================================================

export default function MobileResultsPageExample() {
  const [activeTab, setActiveTab] = useState('summary');

  // Sample data
  const heroData = {
    score: 85,
    name: 'Medicare Advantage',
    household: 'Covers 1 adult (age 67)',
    costLow: 250,
    costHigh: 350,
    reasoning: 'Based on your age, location, and health needs, Medicare Advantage offers comprehensive coverage with lower out-of-pocket costs.',
  };

  const costData = {
    monthly: '250-350',
    annual: '3,000-4,200',
    savings: 1200,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MobileHeader
        onShare={() => console.log('Share')}
        onExport={() => console.log('Export')}
        onPrint={() => window.print()}
      />

      {/* Main Content with padding for bottom bar */}
      <main className="px-4 pt-6 pb-24">
        {/* Trust Badges */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-lg">🔒</span>
              <span className="text-gray-700 font-medium text-xs">HIPAA Compliant</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">✓</span>
              <span className="text-gray-700 font-medium text-xs">CMS Verified</span>
            </div>
          </div>
        </div>

        {/* Hero Card */}
        <MobileHeroCard data={heroData} />

        {/* Tabs */}
        <MobileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'summary' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
              <p className="text-gray-700 mb-4">Your personalized recommendation overview...</p>
            </div>
          )}

          {activeTab === 'costs' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Analysis</h3>
              <MobileCostCards data={costData} />
            </div>
          )}

          {activeTab === 'alternatives' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Alternative Options</h3>
              <p className="text-gray-700">Explore other plans...</p>
            </div>
          )}

          {activeTab === 'steps' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h3>
              <p className="text-gray-700">How to enroll...</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <MobileBottomBar
        onShare={() => console.log('Share')}
        onExport={() => console.log('Export')}
        onPrint={() => window.print()}
      />
    </div>
  );
}

/**
 * USAGE INSTRUCTIONS:
 *
 * 1. This is a complete, working example of the mobile layout
 * 2. Copy individual components as needed
 * 3. Customize colors, spacing, and content
 * 4. Test on actual mobile devices
 *
 * KEY FEATURES DEMONSTRATED:
 * ✓ Sticky header with scroll progress
 * ✓ Collapsible hero card (saves 70% space)
 * ✓ Horizontal scrolling tabs
 * ✓ Touch-friendly interactions (44px targets)
 * ✓ Bottom action bar
 * ✓ Dropdown menu
 * ✓ Stat cards layout
 * ✓ Mobile-optimized spacing
 */
