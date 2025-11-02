import { POPULAR_STATES, ADJACENT_STATE_PAIRS } from './constants';
import { COVERAGE_SCORES } from '@/lib/constants';

/**
 * Calculate coverage score based on multiple states
 *
 * Higher scores = better network availability
 */
export function calculateCoverageScore(states: string[]): number {
  if (states.length === 0) return COVERAGE_SCORES.NO_STATES;
  if (states.length === 1) return COVERAGE_SCORES.SINGLE_STATE;

  // All states are popular (strong networks everywhere)
  const allPopular = states.every(state => POPULAR_STATES.includes(state));
  if (allPopular) {
    return COVERAGE_SCORES.ALL_POPULAR_STATES;
  }

  // Check if all states are adjacent (regional coverage possible)
  if (states.length === 2) {
    const isAdjacent = ADJACENT_STATE_PAIRS.some(
      pair => (pair.includes(states[0]) && pair.includes(states[1]))
    );
    if (isAdjacent) {
      return COVERAGE_SCORES.ADJACENT_STATES;
    }
  }

  // Multiple states across different regions (need national plan)
  // Score decreases slightly with more states for complexity
  if (states.length >= 5) {
    return COVERAGE_SCORES.MANY_STATES;
  }

  return COVERAGE_SCORES.MIXED_REGIONS;
}
