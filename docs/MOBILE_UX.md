# Mobile UX Documentation

This document outlines the mobile-specific optimizations implemented in the Coverage Gap Analyzer application.

## Overview

The application is fully responsive and optimized for mobile devices, providing an excellent user experience on smartphones and tablets. Mobile UX improvements include sticky navigation, larger touch targets, optimized layouts, and mobile-specific components.

## Key Mobile Features

### 1. Sticky Bottom Navigation

**What:** Navigation buttons stick to the bottom of the screen on mobile devices.

**Why:** Makes navigation always accessible without scrolling, following mobile app conventions.

**Implementation:**
- Uses `.sticky-mobile-nav` utility class
- Fixed positioning on mobile (`position: fixed`)
- Static positioning on desktop (`position: static`)
- Applied to all calculator step navigation

**Code Example:**
```tsx
<nav className="sticky-mobile-nav touch-manipulation">
  <button className="flex-1 md:flex-initial touch-manipulation">
    Back
  </button>
  <button className="flex-1 md:flex-initial touch-manipulation">
    Next
  </button>
</nav>
```

### 2. Mobile Progress Bar

**What:** Compact progress indicator at the top of the screen showing current step and completion percentage.

**Why:** Saves vertical space while keeping users informed of their progress.

**Features:**
- Sticky to top of viewport
- Shows step number and name
- Animated progress bar
- Hidden on desktop (desktop shows full progress indicator)
- ARIA-compliant progress indicator

**Component:** `components/MobileProgressBar.tsx`

```tsx
<MobileProgressBar currentStep={3} />
// Shows: "Step 3 of 4: Budget" with 75% progress bar
```

### 3. Touch-Optimized Buttons

**Requirements:**
- Minimum 44x44px tap targets (Apple iOS guidelines)
- Full-width buttons on mobile
- Larger padding and font sizes
- Touch manipulation optimization

**CSS Implementation:**
```css
@media (max-width: 768px) {
  button, a, input[type="checkbox"], input[type="radio"], select {
    min-height: 44px;
    min-width: 44px;
  }
}
```

**Classes:**
- `.touch-manipulation` - Disables double-tap zoom, improves responsiveness
- `.tap-highlight-none` - Removes default tap highlight
- `.btn-mobile` - Mobile-optimized button sizing

### 4. Mobile-Specific Utility Classes

**Spacing:**
- `.mobile-container` - Responsive horizontal padding (4px → 6px → 8px)
- `.mobile-section` - Responsive vertical padding (6px → 8px → 12px)

**Visibility:**
- `.hide-mobile` - Hidden on mobile, visible on desktop
- `.show-mobile` - Visible on mobile, hidden on desktop

**Usage:**
```tsx
{/* Desktop: Full progress indicator */}
<div className="hide-mobile">
  {/* Large circular progress */}
</div>

{/* Mobile: Compact progress bar */}
<div className="show-mobile">
  <MobileProgressBar currentStep={currentStep} />
</div>
```

### 5. Mobile Input Optimization

**Problem:** iOS zooms in when focusing inputs with font-size < 16px

**Solution:** Force 16px font size on mobile inputs

```css
@media (max-width: 768px) {
  input:focus, textarea:focus, select:focus {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
```

### 6. Smooth Scrolling

**Enabled on mobile** for better UX when navigating between sections:

```css
@media (max-width: 768px) {
  html {
    scroll-behavior: smooth;
  }
}
```

### 7. Prevent Horizontal Scroll

Ensures content never causes horizontal scrolling on mobile:

```css
@media (max-width: 768px) {
  body {
    overflow-x: hidden;
  }
}
```

### 8. Webkit Overflow Scrolling

Enables momentum scrolling on iOS for a native feel:

```css
@media (max-width: 768px) {
  * {
    -webkit-overflow-scrolling: touch;
  }
}
```

## Mobile Detection Hooks

Located in `hooks/useMobileDetection.ts`:

### useIsMobile()

Detects if user is on a mobile device:

```tsx
import { useIsMobile } from '@/hooks/useMobileDetection';

const isMobile = useIsMobile();

if (isMobile) {
  // Show mobile-optimized layout
}
```

**Detection Methods:**
- Screen width < 768px
- User agent detection
- Updates on window resize

### useIsTouchDevice()

Detects touch capability:

```tsx
import { useIsTouchDevice } from '@/hooks/useMobileDetection';

const isTouch = useIsTouchDevice();

// Show tap instructions vs click instructions
```

### useViewportSize()

Returns current viewport dimensions:

```tsx
import { useViewportSize } from '@/hooks/useMobileDetection';

const { width, height } = useViewportSize();

// Adjust layout based on exact dimensions
```

### useOrientation()

Detects device orientation:

```tsx
import { useOrientation } from '@/hooks/useMobileDetection';

const orientation = useOrientation(); // 'portrait' | 'landscape'

// Show different layouts for landscape
```

### useLockBodyScroll()

Prevents scrolling (useful for modals):

```tsx
import { useLockBodyScroll } from '@/hooks/useMobileDetection';

const [showModal, setShowModal] = useState(false);
useLockBodyScroll(showModal);
```

### useIsKeyboardVisible()

Detects if virtual keyboard is visible:

```tsx
import { useIsKeyboardVisible } from '@/hooks/useMobileDetection';

const isKeyboardVisible = useIsKeyboardVisible();

// Adjust layout when keyboard appears
```

## Responsive Breakpoints

The application uses Tailwind CSS default breakpoints:

| Breakpoint | Size | Device |
|------------|------|--------|
| `sm` | 640px | Large phones (landscape) |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

**Primary mobile breakpoint:** `md` (768px)

## Mobile-Specific Layouts

### Calculator Page

**Mobile:**
- Compact progress bar at top (sticky)
- Smaller headings (text-3xl → text-2xl)
- Full-width buttons with gap
- Sticky navigation at bottom
- Extra bottom padding (pb-32) for sticky nav clearance

**Desktop:**
- Full circular progress indicator
- Larger headings
- Auto-width buttons
- Inline navigation
- Standard padding

### Results Page

**Mobile:**
- Single column layouts
- Smaller card padding
- Stacked cost breakdown
- Mobile-friendly tooltips (tap instead of hover)

**Desktop:**
- Two-column layouts
- Larger spacing
- Side-by-side comparisons
- Hover tooltips

## Text Size Adjustment

Prevents text from resizing on orientation change:

```css
body {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
```

## Testing Mobile UX

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device (iPhone, iPad, etc.)
4. Test touch interactions
5. Test orientation changes

### Recommended Test Devices

**Phones:**
- iPhone 12/13/14 Pro (390x844)
- iPhone 12/13/14 Pro Max (428x926)
- Samsung Galaxy S21 (360x800)
- Google Pixel 5 (393x851)

**Tablets:**
- iPad (810x1080)
- iPad Pro (1024x1366)

### Mobile UX Checklist

- [ ] All buttons minimum 44x44px
- [ ] No horizontal scrolling
- [ ] Text readable without zoom
- [ ] Forms usable with virtual keyboard
- [ ] Navigation always accessible
- [ ] Touch targets well-spaced (min 8px gap)
- [ ] Loading states visible
- [ ] Error messages readable
- [ ] Progress indicators clear
- [ ] Tooltips work on tap

## Performance Considerations

### Mobile-Specific Optimizations

1. **Lazy Loading:** Components load only when needed
2. **Image Optimization:** None currently (no images used)
3. **Code Splitting:** Automatic via Next.js
4. **Reduced Animations:** Simpler transitions on mobile
5. **Efficient Re-renders:** useReducer, useMemo, useCallback

### Bundle Size

**Mobile JS Bundle:** ~117KB (calculator page)
- Acceptable for 3G connections (~3s on 3G)
- Excellent for 4G/5G (~1s)

## Accessibility on Mobile

All accessibility features work on mobile:

- ✅ VoiceOver (iOS) support
- ✅ TalkBack (Android) support
- ✅ Keyboard navigation (external keyboards)
- ✅ High contrast mode
- ✅ Text resizing up to 200%
- ✅ Screen reader announcements
- ✅ ARIA labels and roles

## Known Limitations

1. **Landscape Orientation:** Some forms may require scrolling in landscape mode on small phones
2. **Small Screens (<360px):** Not optimized for very small screens (< iPhone SE)
3. **Older Devices:** May experience slower performance on devices >5 years old
4. **iOS < 14:** Some CSS features may not work
5. **Android < 10:** Limited testing on older Android versions

## Future Enhancements

Potential mobile UX improvements:

- [ ] Swipe gestures for step navigation
- [ ] Pull-to-refresh functionality
- [ ] Haptic feedback on interactions
- [ ] Progressive Web App (PWA) support
- [ ] Offline functionality
- [ ] Mobile app deep linking
- [ ] Voice input for forms
- [ ] Biometric authentication (if adding accounts)

## Browser Support

**Mobile Browsers:**
- ✅ Safari (iOS 14+)
- ✅ Chrome (Android 10+)
- ✅ Firefox (Latest)
- ✅ Samsung Internet
- ✅ Edge Mobile

**Testing Coverage:**
- Primary: iOS Safari, Chrome Android
- Secondary: Firefox, Samsung Internet
- Minimal: Opera Mobile, UC Browser

---

**Last Updated:** 2025-01-01
**Mobile Version:** 1.0
