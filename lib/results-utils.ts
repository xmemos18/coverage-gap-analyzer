/**
 * Utility functions for results page formatting and scoring
 */

export interface ScoreColor {
  bg: string;
  text: string;
  label: string;
  icon: string;
}

/**
 * Format a cost range for display
 */
export function formatCost(low: number, high: number): string {
  if (low === high) {
    return `$${low.toLocaleString()}`;
  }
  return `$${low.toLocaleString()}-$${high.toLocaleString()}`;
}

/**
 * Get color classes, label, and icon based on coverage score
 * Icons provide visual indicator beyond color for accessibility
 */
export function getScoreColor(score: number): ScoreColor {
  if (score >= 90) {
    return {
      bg: 'bg-success',
      text: 'text-success',
      label: 'Excellent',
      icon: '✓' // Checkmark for excellent
    };
  }
  if (score >= 75) {
    return {
      bg: 'bg-warning',
      text: 'text-warning',
      label: 'Good',
      icon: '○' // Circle for good
    };
  }
  return {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    label: 'Fair',
    icon: '△' // Triangle for fair
  };
}

/**
 * Get priority colors for suggestions
 */
export function getPriorityColors(priority: 'high' | 'medium' | 'low') {
  const colors = {
    high: 'border-red-300 bg-red-50 border-l-4', // Thick left border for emphasis
    medium: 'border-yellow-300 bg-yellow-50 border-l-4',
    low: 'border-blue-300 bg-blue-50 border-l-4',
  };
  return colors[priority];
}

/**
 * Get priority badge with icon and text
 */
export function getPriorityBadge(priority: 'high' | 'medium' | 'low') {
  const badges = {
    high: {
      class: 'bg-red-500 text-white',
      icon: '!',
      text: 'High Priority'
    },
    medium: {
      class: 'bg-yellow-500 text-white',
      icon: '!',
      text: 'Medium Priority'
    },
    low: {
      class: 'bg-blue-500 text-white',
      icon: 'i',
      text: 'Low Priority'
    },
  };
  return badges[priority];
}

/**
 * Get icon for suggestion type
 */
export function getSuggestionIcon(type: 'cost-savings' | 'coverage-improvement' | 'network-expansion' | 'plan-change'): string {
  const icons = {
    'cost-savings': '💰',
    'coverage-improvement': '🛡️',
    'network-expansion': '🌐',
    'plan-change': '🔄',
  };
  return icons[type];
}
