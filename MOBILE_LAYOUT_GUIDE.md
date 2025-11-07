# Mobile Layout Implementation Guide (< 768px)

## 📱 Mobile-First Design Philosophy

**Target Devices:**
- iPhone SE: 375px width
- iPhone 12/13: 390px width
- iPhone 14 Pro Max: 430px width
- Small Android phones: 360px - 480px width

**Core Principles:**
1. **Vertical Flow** - Single column layouts
2. **Thumb-Friendly** - Bottom actions, 44px touch targets
3. **Progressive Disclosure** - Collapsible sections
4. **Clear Hierarchy** - Large text, obvious CTAs
5. **Minimize Scrolling** - Compact, efficient use of space

---

## 1. MOBILE HEADER (56px Height)

### Layout Structure
```
┌─────────────────────────────────────┐
│ [←]      KIM Logo        [⋮ Menu]   │  56px
└─────────────────────────────────────┘
```

### Implementation

```tsx
// components/results/ResultsHeader.tsx - Mobile View

// Mobile Header Structure (< 768px)
<header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm h-14 md:h-20">
  <div className="px-4 h-full flex items-center justify-between">
    {/* Left: Back Button (44x44 touch target) */}
    <button
      onClick={handleBack}
      className="touch-target -ml-2 p-2 text-gray-700 active:bg-gray-100 rounded-lg"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
      </svg>
      <span className="sr-only">Back to calculator</span>
    </button>

    {/* Center: Logo */}
    <a href="/" className="text-xl font-bold text-blue-600">
      KIM
    </a>

    {/* Right: Menu Button (44x44 touch target) */}
    <button
      onClick={() => setShowMobileMenu(true)}
      className="touch-target -mr-2 p-2 text-gray-700 active:bg-gray-100 rounded-lg"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
      <span className="sr-only">Open menu</span>
    </button>
  </div>

  {/* Scroll Progress Indicator (Optional) */}
  <div
    className="absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all"
    style={{ width: `${scrollProgress}%` }}
  />
</header>
```

### Mobile Menu Dropdown

```tsx
// Full-screen mobile menu
{showMobileMenu && (
  <>
    {/* Backdrop with tap to close */}
    <div
      className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
      onClick={() => setShowMobileMenu(false)}
    />

    {/* Slide-down menu */}
    <div className="fixed top-14 left-0 right-0 z-50 bg-white shadow-2xl max-h-[80vh] overflow-y-auto animate-slideDown">
      <div className="p-4 space-y-2">
        {/* Share Action */}
        <button
          onClick={handleShare}
          className="w-full flex items-center gap-4 p-4 text-left rounded-xl active:bg-gray-50 transition-colors touch-target"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Share Results</div>
            <div className="text-sm text-gray-600">Send via email or link</div>
          </div>
        </button>

        {/* Export Action */}
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-4 p-4 text-left rounded-xl active:bg-gray-50 transition-colors touch-target"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Export PDF</div>
            <div className="text-sm text-gray-600">Save for offline viewing</div>
          </div>
        </button>

        {/* Print Action */}
        <button
          onClick={handlePrint}
          className="w-full flex items-center gap-4 p-4 text-left rounded-xl active:bg-gray-50 transition-colors touch-target"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Print</div>
            <div className="text-sm text-gray-600">Print this page</div>
          </div>
        </button>
      </div>
    </div>
  </>
)}
```

---

## 2. MOBILE HERO CARD (Collapsed State)

### Collapsed Layout (Saves ~300px vertical space)
```
┌─────────────────────────────────────┐
│  [85]  Medicare Advantage      [v]  │
│        $250-350/mo                   │
└─────────────────────────────────────┘
   80px height (vs 400px expanded)
```

### Implementation

```tsx
// components/results/EnhancedHeroSummary.tsx - Collapsed Mobile View

{!isExpanded && (
  <button
    onClick={() => setIsExpanded(true)}
    className="
      w-full
      bg-gradient-to-br from-blue-50 to-white
      border-2 border-blue-200
      rounded-2xl
      p-4
      active:scale-[0.99]
      transition-transform
      shadow-md
    "
  >
    <div className="flex items-center gap-3">
      {/* Score Badge - Compact */}
      <div className={`
        w-16 h-16
        rounded-xl
        border-2
        flex flex-col items-center justify-center
        font-bold
        flex-shrink-0
        ${getScoreColor(coverageGapScore)}
      `}>
        <div className="text-2xl leading-none">{coverageGapScore}</div>
        <div className="text-[9px] uppercase font-bold opacity-75 mt-0.5">
          Score
        </div>
      </div>

      {/* Content - Compact */}
      <div className="flex-1 min-w-0 text-left">
        {/* Badge */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold mb-1">
          <span>✨</span>
          <span>RECOMMENDED</span>
        </div>

        {/* Insurance Name - Truncated */}
        <h2 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
          {recommendedInsurance}
        </h2>

        {/* Cost - Prominent */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-blue-600">
            {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
          </span>
          <span className="text-xs text-gray-600 font-medium">/mo</span>
        </div>
      </div>

      {/* Expand Icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  </button>
)}
```

### Expanded Layout (Full Details)
```
┌─────────────────────────────────────┐
│              [Collapse ↑]            │
│                                      │
│         ┌─────────────┐              │
│         │   Score     │              │
│         │     85      │              │
│         │  Excellent  │              │
│         └─────────────┘              │
│                                      │
│    🎯 YOUR BEST MATCH                │
│                                      │
│    Medicare Advantage                │
│                                      │
│    Covers 1 adult (age 67)           │
│                                      │
│    ┌─────────────────────┐          │
│    │   $250-350/month    │          │
│    └─────────────────────┘          │
│                                      │
│    * Estimated range                 │
│                                      │
│ ───────────────────────────────────  │
│                                      │
│ 💡 Why This Recommendation?          │
│                                      │
│ Based on your age and location...    │
│                                      │
└─────────────────────────────────────┘
```

### Implementation

```tsx
// Expanded Mobile View - Vertical Stack

{isExpanded && (
  <div className="
    bg-gradient-to-br from-blue-50 via-white to-blue-50
    border-2 border-blue-200
    rounded-2xl
    shadow-lg
    overflow-hidden
  ">
    {/* Header with Collapse Button */}
    <div className="p-4 flex justify-end">
      <button
        onClick={() => setIsExpanded(false)}
        className="p-2 rounded-full active:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>

    {/* Content - Stacked Vertically */}
    <div className="px-4 pb-6 space-y-6">
      {/* Score Meter - Centered */}
      <div className="flex flex-col items-center">
        <CoverageScoreMeter score={coverageGapScore} />
        <div className={`
          mt-3 px-4 py-2 rounded-lg border-2 font-semibold text-sm
          ${getScoreColor(coverageGapScore)}
        `}>
          {getScoreLabel(coverageGapScore)}
        </div>
      </div>

      {/* Recommendation Details - Centered */}
      <div className="text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs mb-3">
          <span>🎯</span>
          <span>YOUR BEST MATCH</span>
        </div>

        {/* Insurance Type */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3 px-4">
          {recommendedInsurance}
        </h2>

        {/* Household Breakdown */}
        <p className="text-base text-gray-700 mb-6 px-4">
          {householdBreakdown}
        </p>

        {/* Cost Display - Prominent Card */}
        <div className="inline-flex flex-col items-center bg-white border-2 border-blue-300 rounded-xl px-6 py-4 shadow-md mb-2">
          <div className="text-4xl font-bold text-blue-600 mb-1">
            {formatCost(estimatedMonthlyCost.low, estimatedMonthlyCost.high)}
          </div>
          <div className="text-base text-gray-700 font-semibold">
            per month
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 italic px-6">
          * Estimated range. Actual costs vary by plan.
        </p>
      </div>
    </div>

    {/* Reasoning Section */}
    <div className="border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Why This Recommendation?
          </h3>
          <p className="text-sm text-gray-800 leading-relaxed">
            {reasoning}
          </p>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 3. MOBILE TAB NAVIGATION

### Layout
```
┌─────────────────────────────────────┐
│ Sticky at top-14 (below header)     │
│ ◀ 📋 💰 🔍 🏥 ➕ ✅ ▶              │
└─────────────────────────────────────┘
```

### Implementation with Horizontal Scroll

```tsx
// components/results/ImprovedTabNavigation.tsx - Mobile View

<div
  className="sticky bg-white border-b border-gray-200 shadow-sm z-30"
  style={{ top: '56px' }} // Below mobile header
>
  <div className="relative">
    {/* Left Fade Indicator */}
    {showLeftScroll && (
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
    )}

    {/* Scrollable Tabs Container */}
    <div
      ref={tabsContainerRef}
      className="overflow-x-auto no-scrollbar scroll-smooth"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="flex gap-2 p-2 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative
                flex flex-col items-center
                min-w-[72px]
                px-3 py-2
                rounded-lg
                transition-all duration-200
                touch-target
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }
              `}
            >
              {/* Icon */}
              <span className="text-2xl mb-1">{tab.icon}</span>

              {/* Label - Hidden, use only icon on mobile */}
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {tab.label.split(' ')[0]} {/* First word only */}
              </span>

              {/* Badge */}
              {tab.badge > 0 && (
                <span className={`
                  absolute -top-1 -right-1
                  w-5 h-5
                  rounded-full
                  flex items-center justify-center
                  text-[10px] font-bold
                  ${isActive
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-600 text-white'
                  }
                  shadow-md
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>

    {/* Right Fade Indicator */}
    {showRightScroll && (
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
    )}
  </div>
</div>
```

### Swipe Gesture Support (Optional Enhancement)

```tsx
import { useSwipeable } from 'react-swipeable';

function TabContent() {
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Go to next tab
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex < tabs.length - 1) {
        onTabChange(tabs[currentIndex + 1].id);
      }
    },
    onSwipedRight: () => {
      // Go to previous tab
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex > 0) {
        onTabChange(tabs[currentIndex - 1].id);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50, // Min swipe distance
  });

  return (
    <div {...handlers} className="touch-pan-y">
      {/* Tab content */}
    </div>
  );
}
```

---

## 4. MOBILE COST ANALYSIS

### Stat Cards Layout

```tsx
// Mobile: Stack vertically for readability

<div className="space-y-4">
  {/* Monthly Premium Card */}
  <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-5 text-center">
    <div className="text-sm font-semibold text-gray-600 mb-2">
      Monthly Premium
    </div>
    <div className="text-4xl font-bold text-blue-600 mb-1">
      $250-350
    </div>
    <div className="text-xs text-gray-600">
      For your household
    </div>
  </div>

  {/* Annual Cost Card */}
  <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-5 text-center">
    <div className="text-sm font-semibold text-gray-600 mb-2">
      Annual Cost
    </div>
    <div className="text-4xl font-bold text-green-600 mb-1">
      $3,000-4,200
    </div>
    <div className="text-xs text-gray-600">
      Per year estimate
    </div>
  </div>

  {/* Potential Savings Card (if applicable) */}
  <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-5 text-center">
    <div className="text-sm font-semibold text-gray-600 mb-2">
      Potential Savings
    </div>
    <div className="text-4xl font-bold text-purple-600 mb-1">
      $1,200
    </div>
    <div className="text-xs text-gray-600">
      Per year vs current plan
    </div>
  </div>
</div>
```

### Comparison with Visual Progress Bars

```tsx
// Mobile: Stacked comparison with animated bars

<div className="space-y-6">
  {/* Current Plan */}
  <div>
    <div className="flex justify-between items-baseline mb-2">
      <span className="text-sm font-semibold text-gray-700">
        Current Plan
      </span>
      <span className="text-lg font-bold text-gray-900">
        $450/mo
      </span>
    </div>

    {/* Progress Bar */}
    <div className="h-12 bg-gray-200 rounded-lg overflow-hidden">
      <div
        className="h-full bg-gray-500 flex items-center justify-end pr-3 transition-all duration-700 ease-out"
        style={{ width: '90%' }}
      >
        <span className="text-sm font-bold text-white">Current</span>
      </div>
    </div>
  </div>

  {/* Recommended Plan */}
  <div>
    <div className="flex justify-between items-baseline mb-2">
      <span className="text-sm font-semibold text-blue-700">
        Recommended Plan
      </span>
      <span className="text-lg font-bold text-blue-600">
        $300/mo
      </span>
    </div>

    {/* Progress Bar */}
    <div className="h-12 bg-gray-200 rounded-lg overflow-hidden">
      <div
        className="h-full bg-blue-600 flex items-center justify-end pr-3 transition-all duration-700 ease-out"
        style={{ width: '60%' }}
      >
        <span className="text-sm font-bold text-white">Recommended</span>
      </div>
    </div>
  </div>

  {/* Savings Callout */}
  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-green-900 font-medium mb-1">
          You Save
        </div>
        <div className="text-3xl font-bold text-green-700">
          $150
          <span className="text-base">/month</span>
        </div>
      </div>
      <div className="text-5xl">🎉</div>
    </div>
  </div>
</div>
```

---

## 5. MOBILE ALTERNATIVE OPTIONS

### Card Grid Layout

```tsx
// Mobile: Single column, swipeable cards

<div className="space-y-4">
  {alternatives.map((option, index) => (
    <div
      key={index}
      className={`
        bg-white
        rounded-xl
        overflow-hidden
        shadow-lg
        ${index === 0 ? 'border-2 border-blue-600' : 'border border-gray-200'}
      `}
    >
      {/* Header with Badge */}
      <div className={`
        p-4
        ${index === 0 ? 'bg-blue-50' : 'bg-gray-50'}
      `}>
        {index === 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-bold mb-2">
            ⭐ TOP ALTERNATIVE
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{option.icon || '🏥'}</span>
          </div>

          {/* Name and Cost */}
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">
              {option.name}
            </h3>
            <div className="text-2xl font-bold text-blue-600">
              ${option.monthlyCost.low}-${option.monthlyCost.high}
              <span className="text-sm text-gray-600">/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Score */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Coverage Match
          </span>
          <span className="text-sm font-bold text-gray-900">
            {option.coverageScore}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${option.coverageScore}%` }}
          />
        </div>
      </div>

      {/* Pros and Cons */}
      <div className="px-4 py-3 space-y-3">
        {/* Pros */}
        <div>
          <div className="text-xs font-bold text-green-900 uppercase mb-2">
            ✓ Pros
          </div>
          <ul className="space-y-1.5">
            {option.pros.slice(0, 3).map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 flex-shrink-0 mt-0.5">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        {option.cons.length > 0 && (
          <div>
            <div className="text-xs font-bold text-orange-900 uppercase mb-2">
              ⚠ Cons
            </div>
            <ul className="space-y-1.5">
              {option.cons.slice(0, 2).map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-600 flex-shrink-0 mt-0.5">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="p-4 border-t border-gray-100">
        <button className={`
          w-full py-3 rounded-lg font-semibold transition-colors
          ${index === 0
            ? 'bg-blue-600 text-white active:bg-blue-700'
            : 'bg-gray-100 text-gray-900 active:bg-gray-200'
          }
        `}>
          Learn More
        </button>
      </div>
    </div>
  ))}
</div>
```

---

## 6. MOBILE BOTTOM ACTION BAR (Alternative to FAB)

### Fixed Bottom Bar

```tsx
// Alternative to floating action button - bottom sheet style

<div className="
  fixed bottom-0 left-0 right-0
  bg-white
  border-t border-gray-200
  shadow-2xl
  px-4 py-3
  safe-area-bottom
  z-40
  md:hidden
">
  <div className="flex gap-2">
    {/* Share Button */}
    <button
      onClick={handleShare}
      className="
        flex-1
        py-3
        bg-gray-100
        text-gray-900
        rounded-lg
        font-semibold
        active:bg-gray-200
        transition-colors
        touch-target
      "
    >
      <div className="flex flex-col items-center gap-1">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span className="text-xs">Share</span>
      </div>
    </button>

    {/* Export Button */}
    <button
      onClick={handleExport}
      className="
        flex-1
        py-3
        bg-gray-100
        text-gray-900
        rounded-lg
        font-semibold
        active:bg-gray-200
        transition-colors
        touch-target
      "
    >
      <div className="flex flex-col items-center gap-1">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs">PDF</span>
      </div>
    </button>

    {/* Print Button - Primary */}
    <button
      onClick={handlePrint}
      className="
        flex-1
        py-3
        bg-blue-600
        text-white
        rounded-lg
        font-semibold
        active:bg-blue-700
        transition-colors
        shadow-lg
        touch-target
      "
    >
      <div className="flex flex-col items-center gap-1">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span className="text-xs">Print</span>
      </div>
    </button>
  </div>

  {/* Add padding to page content to avoid overlap */}
  <style jsx>{`
    .main-content {
      padding-bottom: 80px; /* Height of bottom bar + safe area */
    }
  `}</style>
</div>
```

---

## 7. MOBILE-SPECIFIC CSS

### Add to `globals.css`

```css
@layer utilities {
  /* Hide scrollbar but keep functionality */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Safe area for iPhone notch/home indicator */
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }

  /* Prevent text selection on tap (for interactive elements) */
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Smooth momentum scrolling on iOS */
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
  }

  /* Prevent pull-to-refresh on mobile */
  .no-overscroll {
    overscroll-behavior: contain;
  }

  /* Mobile-only visibility */
  @media (min-width: 768px) {
    .mobile-only {
      display: none !important;
    }
  }
}
```

---

## 8. MOBILE PERFORMANCE OPTIMIZATIONS

### Image Optimization

```tsx
import Image from 'next/image';

// Use Next.js Image component for automatic optimization
<Image
  src="/insurance-icon.png"
  alt="Insurance type icon"
  width={48}
  height={48}
  loading="lazy"
  quality={75} // Lower quality for mobile
  sizes="(max-width: 768px) 48px"
/>
```

### Lazy Loading Heavy Components

```tsx
import { lazy, Suspense } from 'react';

// Only load comparison table when tab is active
const PlanComparisonTable = lazy(() =>
  import('@/components/results/PlanComparisonTable')
);

// In component
<TabPanel value="alternatives" activeTab={activeTab}>
  {activeTab === 'alternatives' && (
    <Suspense fallback={<TableSkeleton />}>
      <PlanComparisonTable />
    </Suspense>
  )}
</TabPanel>
```

### Reduce JavaScript Bundle

```tsx
// Use CSS animations instead of JS libraries
// Before: import { motion } from 'framer-motion';
// After: Use CSS classes with Tailwind

<div className="animate-fadeIn">
  {/* Content */}
</div>
```

---

## 9. MOBILE TESTING CHECKLIST

### Device Testing
```
□ iPhone SE (375px) - Smallest modern iPhone
□ iPhone 12/13 (390px) - Standard size
□ iPhone 14 Pro Max (430px) - Largest iPhone
□ Small Android (360px) - Budget phones
□ Medium Android (412px) - Most common
□ Large Android (480px) - Phablets
```

### Interaction Testing
```
□ Touch targets are minimum 44x44px
□ Tap feedback is immediate (active states)
□ Swipe gestures work smoothly
□ Scroll is momentum-based
□ Pull-to-refresh doesn't interfere
□ Pinch-to-zoom disabled on UI elements
□ Double-tap doesn't cause unwanted zooms
```

### Performance Testing
```
□ Page loads in < 3 seconds on 3G
□ Images are optimized and lazy-loaded
□ No layout shift when loading
□ Smooth 60fps scrolling
□ No jank during animations
□ Memory usage stays under 50MB
```

### Accessibility Testing
```
□ All text is readable at default zoom
□ Touch targets don't overlap
□ Focus indicators are visible
□ Screen reader reads content in order
□ Color contrast meets WCAG AA (4.5:1)
```

---

## 10. MOBILE-SPECIFIC TIPS

### Typography
- **Minimum font size**: 16px (prevents zoom on input focus)
- **Line height**: 1.5-1.6 for body text (easier reading)
- **Paragraph width**: Max 75 characters (better readability)
- **Headings**: Use size scales (2xl → xl → lg → base)

### Spacing
- **Padding**: Minimum 16px (1rem) from screen edges
- **Between sections**: 24-32px (1.5-2rem)
- **Between elements**: 12-16px (0.75-1rem)
- **Touch targets**: Minimum 44px with 8px gap

### Colors
- **Text**: Minimum 4.5:1 contrast ratio
- **Backgrounds**: Use subtle gradients for depth
- **Borders**: 1-2px for clarity on small screens
- **Shadows**: Use sparingly, subtle elevation

### Animations
- **Duration**: 200-300ms (feels snappy)
- **Easing**: `ease-out` for opening, `ease-in` for closing
- **Respect**: `prefers-reduced-motion` setting
- **Performance**: Use transform and opacity only

---

## MOBILE LAYOUT SUMMARY

### Key Differences from Desktop

| Element | Desktop | Mobile |
|---------|---------|--------|
| **Header** | 64px, breadcrumb + actions | 56px, logo + menu |
| **Hero Card** | Always expanded | Collapsible (saves 70%) |
| **Tabs** | Full labels, centered | Icons + scroll, sticky |
| **Layout** | Multi-column grids | Single column stack |
| **Actions** | Toolbar top-right | Bottom bar or dropdown |
| **Touch Targets** | Mouse-sized (24px+) | Finger-sized (44px+) |
| **Typography** | Larger scale | Compact scale |
| **Spacing** | Generous | Efficient |

### Space Savings
- **Hero collapsed**: ~300px saved
- **Single column**: No wasted horizontal space
- **Compact spacing**: ~20% less vertical scroll
- **Sticky elements**: Navigation always accessible

**Total Result**: ~40% less scrolling on mobile! 🎉

---

*Mobile Layout Guide v1.0*
*Optimized for < 768px screens*
