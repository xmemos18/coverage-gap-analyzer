/**
 * Utility functions for generating enrollment URLs for health insurance marketplaces
 */

import { STATE_DATA } from './stateSpecificData';

/**
 * Get the appropriate marketplace enrollment URL based on the state
 *
 * States with their own exchanges get directed to their state marketplace
 * All other states use Healthcare.gov
 *
 * @param state - Two-letter state code (e.g., "CA", "NY", "FL")
 * @param zipCode - Optional ZIP code to pre-fill
 * @param planId - Optional plan ID for Healthcare.gov direct links
 * @returns URL to the appropriate marketplace
 */
export function getMarketplaceEnrollmentUrl(
  state?: string,
  zipCode?: string,
  planId?: string
): string {
  // If we have a state, check if it has its own exchange
  if (state) {
    const stateData = STATE_DATA[state.toUpperCase()];

    if (stateData?.hasStateExchange && stateData?.exchangeURL) {
      // Return state exchange URL
      return stateData.exchangeURL;
    }
  }

  // Use Healthcare.gov for all other states
  const baseUrl = 'https://www.healthcare.gov/see-plans/';

  // If we have ZIP and state, create a targeted search URL
  if (zipCode && state) {
    const params = new URLSearchParams({
      zip: zipCode,
      state: state.toUpperCase(),
      year: new Date().getFullYear().toString(),
    });

    // Add plan ID if provided (for direct plan links)
    if (planId) {
      params.append('plan', planId);
    }

    return `${baseUrl}#/plan/results?${params.toString()}`;
  }

  // Fallback to general marketplace page
  return 'https://www.healthcare.gov/';
}

/**
 * Get the marketplace name for a given state
 *
 * @param state - Two-letter state code
 * @returns Name of the marketplace (e.g., "Covered California", "Healthcare.gov")
 */
export function getMarketplaceName(state?: string): string {
  if (!state) {
    return 'Healthcare.gov';
  }

  const stateData = STATE_DATA[state.toUpperCase()];

  if (stateData?.hasStateExchange && stateData?.exchangeName) {
    return stateData.exchangeName;
  }

  return 'Healthcare.gov';
}

/**
 * Check if a state uses Healthcare.gov or has its own exchange
 *
 * @param state - Two-letter state code
 * @returns true if state has its own exchange, false if uses Healthcare.gov
 */
export function hasStateExchange(state?: string): boolean {
  if (!state) {
    return false;
  }

  const stateData = STATE_DATA[state.toUpperCase()];
  return stateData?.hasStateExchange ?? false;
}

/**
 * Get Medicaid enrollment URL for a given state
 *
 * @param state - Two-letter state code
 * @returns URL to apply for Medicaid in the state
 */
export function getMedicaidEnrollmentUrl(state?: string): string {
  if (!state) {
    return 'https://www.medicaid.gov/medicaid/how-to-apply/index.html';
  }

  const stateCode = state.toUpperCase();
  const stateData = STATE_DATA[stateCode];

  // If the state has its own exchange, use that for Medicaid applications too
  if (stateData?.hasStateExchange && stateData?.exchangeURL) {
    return stateData.exchangeURL;
  }

  // Otherwise, use Healthcare.gov Medicaid application
  return `https://www.healthcare.gov/medicaid-chip/${stateCode.toLowerCase()}/`;
}
