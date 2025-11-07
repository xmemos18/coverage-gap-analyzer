/**
 * DESIGN TOKENS
 *
 * Centralized design system tokens for the results page.
 * Use these tokens for consistent styling across all components.
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const colors = {
  // Primary (Blue)
  primary: {
    50: 'bg-blue-50',
    100: 'bg-blue-100',
    200: 'bg-blue-200',
    300: 'bg-blue-300',
    400: 'bg-blue-400',
    500: 'bg-blue-500',
    600: 'bg-blue-600',
    700: 'bg-blue-700',
    800: 'bg-blue-800',
    900: 'bg-blue-900',
  },

  // Success (Green)
  success: {
    50: 'bg-green-50',
    100: 'bg-green-100',
    200: 'bg-green-200',
    300: 'bg-green-300',
    400: 'bg-green-400',
    500: 'bg-green-500',
    600: 'bg-green-600',
    700: 'bg-green-700',
    800: 'bg-green-800',
    900: 'bg-green-900',
  },

  // Warning (Amber)
  warning: {
    50: 'bg-amber-50',
    100: 'bg-amber-100',
    200: 'bg-amber-200',
    300: 'bg-amber-300',
    400: 'bg-amber-400',
    500: 'bg-amber-500',
    600: 'bg-amber-600',
    700: 'bg-amber-700',
    800: 'bg-amber-800',
    900: 'bg-amber-900',
  },

  // Error (Red)
  error: {
    50: 'bg-red-50',
    100: 'bg-red-100',
    200: 'bg-red-200',
    300: 'bg-red-300',
    400: 'bg-red-400',
    500: 'bg-red-500',
    600: 'bg-red-600',
    700: 'bg-red-700',
    800: 'bg-red-800',
    900: 'bg-red-900',
  },

  // Neutral (Gray)
  neutral: {
    50: 'bg-gray-50',
    100: 'bg-gray-100',
    200: 'bg-gray-200',
    300: 'bg-gray-300',
    400: 'bg-gray-400',
    500: 'bg-gray-500',
    600: 'bg-gray-600',
    700: 'bg-gray-700',
    800: 'bg-gray-800',
    900: 'bg-gray-900',
  },

  // Indigo (Secondary)
  indigo: {
    50: 'bg-indigo-50',
    100: 'bg-indigo-100',
    600: 'bg-indigo-600',
  },

  // Cyan
  cyan: {
    50: 'bg-cyan-50',
    100: 'bg-cyan-100',
  },

  // Emerald
  emerald: {
    50: 'bg-emerald-50',
  },

  // Yellow
  yellow: {
    100: 'bg-yellow-100',
    600: 'bg-yellow-600',
  },
};

// Text colors
export const textColors = {
  primary: {
    600: 'text-blue-600',
    700: 'text-blue-700',
    800: 'text-blue-800',
    900: 'text-blue-900',
  },
  success: {
    600: 'text-green-600',
    700: 'text-green-700',
    800: 'text-green-800',
    900: 'text-green-900',
  },
  warning: {
    600: 'text-amber-600',
    700: 'text-amber-700',
    800: 'text-amber-800',
    900: 'text-amber-900',
  },
  error: {
    600: 'text-red-600',
    700: 'text-red-700',
    800: 'text-red-800',
    900: 'text-red-900',
  },
  neutral: {
    500: 'text-gray-500',
    600: 'text-gray-600',
    700: 'text-gray-700',
    800: 'text-gray-800',
    900: 'text-gray-900',
  },
};

// Border colors
export const borderColors = {
  primary: {
    200: 'border-blue-200',
    300: 'border-blue-300',
    600: 'border-blue-600',
  },
  success: {
    300: 'border-green-300',
    500: 'border-green-500',
  },
  warning: {
    300: 'border-amber-300',
  },
  error: {
    300: 'border-red-300',
  },
  neutral: {
    200: 'border-gray-200',
    300: 'border-gray-300',
  },
};

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  // Section spacing
  section: {
    mobile: 'py-8',
    desktop: 'md:py-12',
    large: 'lg:py-16',
    combined: 'py-8 md:py-12 lg:py-16',
  },

  // Card padding
  card: {
    small: 'p-4',
    medium: 'p-4 md:p-6',
    large: 'p-4 md:p-6 lg:p-8',
    xlarge: 'p-6 md:p-8',
  },

  // Element spacing
  element: {
    tight: 'space-y-2',
    normal: 'space-y-3 md:space-y-4',
    relaxed: 'space-y-4 md:space-y-6',
    loose: 'space-y-6 md:space-y-8',
  },

  // Gap utilities
  gap: {
    small: 'gap-2',
    medium: 'gap-3 md:gap-4',
    large: 'gap-4 md:gap-6',
    xlarge: 'gap-6 md:gap-8',
  },

  // Margins
  margin: {
    section: 'mt-8 md:mt-12',
    subsection: 'mt-6 md:mt-8',
    element: 'mt-4 md:mt-6',
  },
};

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  // Display (Page titles)
  display: {
    base: 'text-3xl md:text-4xl lg:text-5xl font-bold',
    color: 'text-gray-900',
    combined: 'text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900',
  },

  // Headline (Section titles)
  headline: {
    base: 'text-2xl md:text-3xl font-bold',
    color: 'text-gray-900',
    combined: 'text-2xl md:text-3xl font-bold text-gray-900',
  },

  // Title (Subsection titles)
  title: {
    base: 'text-xl md:text-2xl font-semibold',
    color: 'text-gray-900',
    combined: 'text-xl md:text-2xl font-semibold text-gray-900',
  },

  // Subtitle
  subtitle: {
    base: 'text-lg md:text-xl font-semibold',
    color: 'text-gray-800',
    combined: 'text-lg md:text-xl font-semibold text-gray-800',
  },

  // Body (Regular text)
  body: {
    large: 'text-base md:text-lg',
    base: 'text-sm md:text-base',
    color: 'text-gray-700',
    combined: 'text-base md:text-lg text-gray-700',
  },

  // Small (Helper text)
  small: {
    base: 'text-sm md:text-base',
    tiny: 'text-xs md:text-sm',
    color: 'text-gray-600',
    combined: 'text-sm md:text-base text-gray-600',
  },

  // Score (Large numbers)
  score: {
    large: 'text-4xl md:text-5xl font-bold',
    xlarge: 'text-5xl md:text-6xl font-bold',
    color: 'text-white',
  },

  // Price (Cost displays)
  price: {
    large: 'text-3xl md:text-4xl font-bold',
    medium: 'text-2xl md:text-3xl font-bold',
    color: 'text-blue-600',
  },
};

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const components = {
  // Cards
  card: {
    base: 'bg-white rounded-xl border-2 border-gray-200 shadow-sm',
    hover: 'hover:shadow-md transition-shadow',
    interactive: 'bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
  },

  // Glass effect
  glass: {
    light: 'bg-white bg-opacity-70 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-xl',
    dark: 'bg-gray-900 bg-opacity-70 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl',
  },

  // Buttons
  button: {
    primary:
      'inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl',
    secondary:
      'inline-flex items-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors',
    outline:
      'inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors',
  },

  // Badges
  badge: {
    primary: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700',
    success: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700',
    warning: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700',
    error: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700',
    neutral: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700',
  },

  // Alerts
  alert: {
    success: 'bg-green-50 border-2 border-green-300 rounded-xl p-5 shadow-sm',
    warning: 'bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-sm',
    error: 'bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-sm',
    info: 'bg-blue-50 border-2 border-blue-300 rounded-xl p-5 shadow-sm',
  },

  // Gradients
  gradient: {
    blueIndigo: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    blueWhite: 'bg-gradient-to-br from-blue-50 to-white',
    grayWhite: 'bg-gradient-to-br from-gray-50 to-white',
    greenEmerald: 'bg-gradient-to-r from-green-50 to-emerald-50',
    blueCyan: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    blueIndigoStrong: 'bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-100',
  },

  // Score circles (based on score)
  scoreCircle: {
    excellent: 'bg-gradient-to-br from-green-400 to-green-600', // 90-100
    good: 'bg-gradient-to-br from-blue-400 to-blue-600', // 70-89
    fair: 'bg-gradient-to-br from-amber-400 to-amber-600', // 50-69
    poor: 'bg-gradient-to-br from-red-400 to-red-600', // 0-49
  },
};

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

export const layout = {
  // Container
  container: {
    base: 'container mx-auto px-4 sm:px-6 lg:px-8',
    narrow: 'max-w-4xl mx-auto px-4 sm:px-6',
    wide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  },

  // Grids
  grid: {
    responsive2: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
    responsive3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    responsive4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  },

  // Flex
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start gap-3',
    column: 'flex flex-col gap-4',
  },

  // Touch targets (minimum 44x44px)
  touchTarget: 'min-h-[44px] min-w-[44px] flex items-center justify-center',

  // Safe areas (for mobile devices)
  safeArea: {
    bottom: 'pb-safe-bottom',
    top: 'pt-safe-top',
  },
};

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

export const animations = {
  fadeIn: 'animate-fadeIn',
  slideDown: 'animate-slideDown',
  slideUp: 'animate-slideUp',
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
  },
};

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

export const accessibility = {
  // Screen reader only
  srOnly: 'sr-only',

  // Focus states
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
  },

  // Skip links
  skipLink:
    'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600',
};

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px', // Small devices
  md: '768px', // Medium devices (tablets)
  lg: '1024px', // Large devices (desktops)
  xl: '1280px', // Extra large devices
  '2xl': '1536px', // 2X large devices
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get score-based color classes
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return components.scoreCircle.excellent;
  if (score >= 70) return components.scoreCircle.good;
  if (score >= 50) return components.scoreCircle.fair;
  return components.scoreCircle.poor;
}

/**
 * Get confidence level badge classes
 */
export function getConfidenceBadge(level: 'high' | 'medium' | 'low'): string {
  if (level === 'high') return components.badge.success;
  if (level === 'medium') return components.badge.primary;
  return components.badge.warning;
}

/**
 * Get comparison icon color classes
 */
export function getComparisonIconColor(icon: 'check' | 'cross' | 'warning' | 'dash'): string {
  if (icon === 'check') return 'text-green-600';
  if (icon === 'cross') return 'text-red-600';
  if (icon === 'warning') return 'text-amber-600';
  return 'text-gray-400';
}

/**
 * Format price range
 */
export function formatPriceRange(
  price: { min: number; max: number } | 'free' | 'varies',
  period: 'month' | 'year' = 'month'
): string {
  if (price === 'free') return '$0/month';
  if (price === 'varies') return 'Varies by employer';
  if (typeof price === 'object') {
    if (price.min === price.max) {
      return `$${price.min.toLocaleString()}/${period}`;
    }
    return `$${price.min.toLocaleString()}-$${price.max.toLocaleString()}/${period}`;
  }
  return 'Contact for pricing';
}

/**
 * Get insurance type color
 */
export function getInsuranceTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    Medicare: 'bg-blue-100 text-blue-700',
    'Medicare Advantage': 'bg-indigo-100 text-indigo-700',
    'ACA Marketplace': 'bg-green-100 text-green-700',
    Medicaid: 'bg-cyan-100 text-cyan-700',
    Employer: 'bg-purple-100 text-purple-700',
    COBRA: 'bg-amber-100 text-amber-700',
    'Short-term': 'bg-gray-100 text-gray-700',
  };
  return typeColors[type] || 'bg-gray-100 text-gray-700';
}
