/**
 * State constants for insurance coverage calculations
 */

// States with strong insurance networks
export const POPULAR_STATES = [
  'NY', 'CA', 'FL', 'TX', 'AZ', 'IL', 'PA', 'OH', 'NC', 'GA'
];

// Adjacent state pairs that often share regional networks
export const ADJACENT_STATE_PAIRS = [
  ['NY', 'NJ'], ['NY', 'CT'], ['NY', 'PA'],
  ['WA', 'OR'], ['CA', 'NV'], ['CA', 'AZ'],
  ['FL', 'GA'], ['TX', 'LA'], ['IL', 'WI'],
  ['MA', 'NH'], ['MA', 'RI'], ['MA', 'CT'],
];
