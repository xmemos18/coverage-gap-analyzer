/**
 * Safely parse integer from URL parameter with fallback
 */
export function safeParseInt(value: string | null, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
}

/**
 * Safely parse float from URL parameter with fallback
 */
export function safeParseFloat(value: string | null, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
}

/**
 * Calculate average of a cost range
 */
export function getAverageCost(costRange: { low: number; high: number }): number {
  return (costRange.low + costRange.high) / 2;
}
