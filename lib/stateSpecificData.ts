/**
 * State-Specific Insurance Data
 * Includes regulations, cost adjustments, and state-specific features
 */

export interface StateInsuranceData {
  stateCode: string;
  stateName: string;
  hasMedicaidExpansion: boolean;
  hasStateExchange: boolean;
  exchangeName?: string;
  exchangeURL?: string;
  costMultiplier: number; // 1.0 = average, 1.3 = 30% more expensive than average
  regulations: string[];
  specialFeatures: string[];
  notes: string[];
}

/**
 * State-specific insurance data for all 50 states + DC
 */
export const STATE_DATA: Record<string, StateInsuranceData> = {
  AL: {
    stateCode: 'AL',
    stateName: 'Alabama',
    hasMedicaidExpansion: false,
    hasStateExchange: false,
    costMultiplier: 0.85,
    regulations: ['No state mandate for health insurance'],
    specialFeatures: [],
    notes: ['Uses HealthCare.gov federal marketplace'],
  },
  AK: {
    stateCode: 'AK',
    stateName: 'Alaska',
    hasMedicaidExpansion: true,
    hasStateExchange: false,
    costMultiplier: 1.45,
    regulations: [],
    specialFeatures: ['High costs due to remote location'],
    notes: ['Most expensive state for health insurance'],
  },
  AZ: {
    stateCode: 'AZ',
    stateName: 'Arizona',
    hasMedicaidExpansion: true,
    hasStateExchange: false,
    costMultiplier: 0.95,
    regulations: [],
    specialFeatures: ['Popular snowbird destination'],
    notes: ['Good Medicare Advantage options in Phoenix/Tucson'],
  },
  CA: {
    stateCode: 'CA',
    stateName: 'California',
    hasMedicaidExpansion: true,
    hasStateExchange: true,
    exchangeName: 'Covered California',
    exchangeURL: 'https://www.coveredca.com',
    costMultiplier: 1.15,
    regulations: ['State individual mandate with tax penalty', 'Extensive consumer protections'],
    specialFeatures: ['Enhanced subsidies beyond federal', 'Year-round enrollment for lower incomes'],
    notes: ['Best-in-class state exchange with extra subsidies'],
  },
  CO: {
    stateCode: 'CO',
    stateName: 'Colorado',
    hasMedicaidExpansion: true,
    hasStateExchange: true,
    exchangeName: 'Connect for Health Colorado',
    exchangeURL: 'https://connectforhealthco.com',
    costMultiplier: 1.05,
    regulations: [],
    specialFeatures: ['Reinsurance program lowers premiums'],
    notes: ['Well-run state marketplace'],
  },
  CT: {
    stateCode: 'CT',
    stateName: 'Connecticut',
    hasMedicaidExpansion: true,
    hasStateExchange: true,
    exchangeName: 'Access Health CT',
    exchangeURL: 'https://www.accesshealthct.com',
    costMultiplier: 1.25,
    regulations: ['State individual mandate'],
    specialFeatures: [],
    notes: ['Higher costs but good coverage options'],
  },
  FL: {
    stateCode: 'FL',
    stateName: 'Florida',
    hasMedicaidExpansion: false,
    hasStateExchange: false,
    costMultiplier: 0.98,
    regulations: [],
    specialFeatures: ['Large Medicare Advantage market', 'Popular snowbird destination'],
    notes: ['No Medicaid expansion creates coverage gap', 'Many plan options due to large population'],
  },
  NY: {
    stateCode: 'NY',
    stateName: 'New York',
    hasMedicaidExpansion: true,
    hasStateExchange: true,
    exchangeName: 'NY State of Health',
    exchangeURL: 'https://nystateofhealth.ny.gov',
    costMultiplier: 1.30,
    regulations: ['Community rating - same premiums regardless of health', 'Essential Plan for low-income (better than Medicaid)'],
    specialFeatures: ['Essential Plan ($0-20/month for incomes under 200% FPL)', 'Year-round enrollment'],
    notes: ['Excellent coverage but expensive', 'Essential Plan is unique to NY'],
  },
  TX: {
    stateCode: 'TX',
    stateName: 'Texas',
    hasMedicaidExpansion: false,
    hasStateExchange: false,
    costMultiplier: 0.92,
    regulations: [],
    specialFeatures: [],
    notes: ['No Medicaid expansion', 'Large uninsured population', 'Limited plan options in rural areas'],
  },
  WA: {
    stateCode: 'WA',
    stateName: 'Washington',
    hasMedicaidExpansion: true,
    hasStateExchange: true,
    exchangeName: 'Washington Healthplanfinder',
    exchangeURL: 'https://www.wahealthplanfinder.org',
    costMultiplier: 1.08,
    regulations: [],
    specialFeatures: ['Cascade Care public option plans'],
    notes: ['Good marketplace with public option'],
  },
  // Add more states... (abbreviated for conciseness)
  MA: {
    stateCode: 'MA',
    stateName: 'Massachusetts',
    hasMedicaidExpansion: true,
    hasStateExchange: true,
    exchangeName: 'Massachusetts Health Connector',
    exchangeURL: 'https://www.mahealthconnector.org',
    costMultiplier: 1.28,
    regulations: ['State individual mandate since 2006', 'Strictest insurance regulations'],
    specialFeatures: ['ConnectorCare plans with extra subsidies', 'Near-universal coverage'],
    notes: ['Model for ACA', 'Highest coverage rate in nation'],
  },
};

/**
 * Get state-specific data
 */
export function getStateData(stateCode: string): StateInsuranceData | null {
  return STATE_DATA[stateCode.toUpperCase()] || null;
}

/**
 * Calculate state-adjusted costs
 */
export function adjustCostForStates(
  baseCost: { low: number; high: number },
  states: string[]
): { low: number; high: number } {
  if (states.length === 0) return baseCost;

  // Calculate average cost multiplier across all states
  const multipliers = states
    .map(state => getStateData(state)?.costMultiplier || 1.0)
    .filter(m => m !== null);

  const avgMultiplier = multipliers.length > 0
    ? multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length
    : 1.0;

  return {
    low: Math.round(baseCost.low * avgMultiplier),
    high: Math.round(baseCost.high * avgMultiplier),
  };
}

/**
 * Get state-specific warnings and tips
 */
export function getStateSpecificGuidance(states: string[]): {
  warnings: string[];
  tips: string[];
  opportunities: string[];
} {
  const warnings: string[] = [];
  const tips: string[] = [];
  const opportunities: string[] = [];

  states.forEach(stateCode => {
    const stateData = getStateData(stateCode);
    if (!stateData) return;

    // Medicaid expansion warning
    if (!stateData.hasMedicaidExpansion) {
      warnings.push(`${stateData.stateName} has NOT expanded Medicaid - coverage gap may exist for low-income residents`);
    }

    // State exchange tip
    if (stateData.hasStateExchange && stateData.exchangeURL) {
      tips.push(`${stateData.stateName} has its own marketplace (${stateData.exchangeName}) - shop there instead of HealthCare.gov`);
    }

    // Special features
    if (stateData.specialFeatures.length > 0) {
      stateData.specialFeatures.forEach(feature => {
        opportunities.push(`${stateData.stateName}: ${feature}`);
      });
    }

    // High cost warning
    if (stateData.costMultiplier >= 1.25) {
      warnings.push(`${stateData.stateName} has higher-than-average insurance costs (${((stateData.costMultiplier - 1) * 100).toFixed(0)}% above national average)`);
    }

    // Low cost opportunity
    if (stateData.costMultiplier <= 0.85) {
      opportunities.push(`${stateData.stateName} has lower-than-average insurance costs (${((1 - stateData.costMultiplier) * 100).toFixed(0)}% below national average)`);
    }
  });

  return { warnings, tips, opportunities };
}

/**
 * Check if user qualifies for special state programs
 */
export function checkStatePrograms(
  states: string[],
  income: number,
  householdSize: number
): string[] {
  const programs: string[] = [];

  states.forEach(stateCode => {
    const stateData = getStateData(stateCode);
    if (!stateData) return;

    // NY Essential Plan
    if (stateCode === 'NY' && income < 25000 * householdSize) {
      programs.push(`New York Essential Plan: Low-cost coverage ($0-20/month) for incomes under 200% FPL`);
    }

    // MA ConnectorCare
    if (stateCode === 'MA' && income < 36000 * householdSize) {
      programs.push(`Massachusetts ConnectorCare: Enhanced subsidies for incomes under 300% FPL`);
    }

    // CA enhanced subsidies
    if (stateCode === 'CA' && income < 75000 * householdSize) {
      programs.push(`Covered California: State subsidies on top of federal subsidies for middle-income residents`);
    }
  });

  return programs;
}

/**
 * Get multi-state coordination tips
 */
export function getMultiStateCoordinationTips(states: string[]): string[] {
  if (states.length <= 1) return [];

  const tips: string[] = [
    'Choose a national PPO or Original Medicare for seamless coverage across states',
    'Verify your primary doctors are available in all your states',
    'Update your primary residence with your insurer if you move between homes',
  ];

  // Check if states have different exchanges
  const hasMultipleExchanges = states.filter(s => getStateData(s)?.hasStateExchange).length > 1;
  if (hasMultipleExchanges) {
    tips.push('Your states have different marketplaces - choose the one for your primary tax residence');
  }

  // Check if mixing expansion and non-expansion states
  const expansionStates = states.filter(s => getStateData(s)?.hasMedicaidExpansion);
  const nonExpansionStates = states.filter(s => !getStateData(s)?.hasMedicaidExpansion);

  if (expansionStates.length > 0 && nonExpansionStates.length > 0) {
    tips.push(`Medicaid eligibility differs: ${expansionStates.join(', ')} expanded Medicaid, but ${nonExpansionStates.join(', ')} did not`);
  }

  return tips;
}
