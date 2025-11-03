/**
 * Helper functions for residence-related UI logic
 */

/**
 * Convert month value to human-readable label
 * @param months - Numeric month value (2, 5, 8, or 11)
 * @returns Human-readable month range label
 */
export function getMonthLabel(months: number): string {
  switch (months) {
    case 2:
      return '1-3 months';
    case 5:
      return '4-6 months';
    case 8:
      return '7-9 months';
    case 11:
      return '10-12 months';
    default:
      return `${months} months`;
  }
}

/**
 * Get all available month options for select dropdown
 */
export const MONTH_OPTIONS = [
  { value: 2, label: '1-3 months' },
  { value: 5, label: '4-6 months' },
  { value: 8, label: '7-9 months' },
  { value: 11, label: '10-12 months' },
] as const;
