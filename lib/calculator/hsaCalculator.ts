/**
 * HSA (Health Savings Account) Calculator
 * Helps users understand HSA tax benefits with HDHP plans
 */

export interface HSAAnalysis {
  isEligible: boolean;
  contributionLimits: {
    individual: number;
    family: number;
    catchUp: number; // Age 55+
  };
  maxContribution: number;
  taxSavings: {
    federal: number;
    fica: number; // 7.65%
    state: number; // Estimate
    total: number;
  };
  projections: {
    year1: number;
    year5: number;
    year10: number;
    retirement: number; // Age 65
  };
  tripleTaxAdvantage: string[];
  benefits: string[];
  considerations: string[];
  recommendation: string;
}

/**
 * 2024 HSA Contribution Limits
 */
const HSA_LIMITS_2024 = {
  INDIVIDUAL: 4150,
  FAMILY: 8300,
  CATCH_UP: 1000, // Age 55+
};

/**
 * 2024 HDHP Minimum Deductibles (to qualify for HSA)
 */
const HDHP_MIN_DEDUCTIBLES = {
  INDIVIDUAL: 1600,
  FAMILY: 3200,
};

/**
 * Calculate HSA benefits and tax savings
 */
export function calculateHSABenefits(
  familySize: number,
  age: number,
  income: number,
  stateIncomeTaxRate: number = 0.05 // Default 5%
): HSAAnalysis {
  const isFamily = familySize > 1;
  const isCatchUpEligible = age >= 55;

  // Determine contribution limits
  const contributionLimits = {
    individual: HSA_LIMITS_2024.INDIVIDUAL,
    family: HSA_LIMITS_2024.FAMILY,
    catchUp: HSA_LIMITS_2024.CATCH_UP,
  };

  const baseContribution = isFamily ? HSA_LIMITS_2024.FAMILY : HSA_LIMITS_2024.INDIVIDUAL;
  const catchUpAmount = isCatchUpEligible ? HSA_LIMITS_2024.CATCH_UP : 0;
  const maxContribution = baseContribution + catchUpAmount;

  // Calculate tax bracket (simplified)
  let federalTaxRate = 0.22; // Default 22% bracket
  if (income < 44725) federalTaxRate = 0.12;
  else if (income < 95375) federalTaxRate = 0.22;
  else if (income < 182100) federalTaxRate = 0.24;
  else if (income < 231250) federalTaxRate = 0.32;
  else if (income < 578125) federalTaxRate = 0.35;
  else federalTaxRate = 0.37;

  // Calculate tax savings
  const federalSavings = maxContribution * federalTaxRate;
  const ficaSavings = maxContribution * 0.0765; // 7.65% FICA
  const stateSavings = maxContribution * stateIncomeTaxRate;
  const totalTaxSavings = federalSavings + ficaSavings + stateSavings;

  // Project growth (assuming 7% annual return)
  const annualReturn = 0.07;
  const year1 = maxContribution;
  const year5 = calculateFutureValue(maxContribution, annualReturn, 5);
  const year10 = calculateFutureValue(maxContribution, annualReturn, 10);

  // Retirement projection (age 65 or 30 years, whichever is longer)
  const yearsToRetirement = Math.max(65 - age, 30);
  const retirement = calculateFutureValue(maxContribution, annualReturn, yearsToRetirement);

  const tripleTaxAdvantage = [
    '1️⃣ Contributions are tax-deductible (reduce taxable income)',
    '2️⃣ Investment growth is tax-free (no capital gains)',
    '3️⃣ Withdrawals for medical expenses are tax-free',
  ];

  const benefits = [
    `Save $${totalTaxSavings.toLocaleString()} in taxes per year`,
    'Lower health insurance premiums (HDHP plans cost less)',
    'Account rolls over year to year (no "use it or lose it")',
    'Portable - keep it if you change jobs',
    'After age 65, can use for non-medical expenses (taxed as income)',
    'Can invest HSA funds for long-term growth',
  ];

  const considerations = [
    `High deductible: $${HDHP_MIN_DEDUCTIBLES.INDIVIDUAL.toLocaleString()} individual / $${HDHP_MIN_DEDUCTIBLES.FAMILY.toLocaleString()} family minimum`,
    'Must pay full cost of care until deductible is met',
    'Best for healthy individuals with emergency savings',
    'Can use HSA funds to pay deductible if needed',
    'Must be enrolled in HDHP (High-Deductible Health Plan)',
    'Cannot be on Medicare or claimed as a dependent',
  ];

  // Generate recommendation
  let recommendation = '';
  if (age < 50 && income > 60000) {
    recommendation = `Excellent fit! You're young enough to benefit from long-term growth ($${retirement.toLocaleString()} by retirement) and earn enough to max out contributions. HSA is one of the best retirement savings vehicles available.`;
  } else if (age >= 55) {
    recommendation = `Good fit with catch-up contributions ($${maxContribution.toLocaleString()}/year). Use HSA as supplemental retirement account - can pay Medicare premiums tax-free after 65.`;
  } else if (income < 40000) {
    recommendation = 'HSA can work but may be challenging to max out. Prioritize emergency fund first. Even partial HSA contributions ($1,000-2,000/year) provide tax benefits.';
  } else {
    recommendation = `HSA is worth considering. Save $${totalTaxSavings.toLocaleString()}/year in taxes and build tax-free medical savings. Best for those with minimal healthcare needs and emergency savings.`;
  }

  return {
    isEligible: true, // Assuming HDHP enrollment
    contributionLimits,
    maxContribution,
    taxSavings: {
      federal: federalSavings,
      fica: ficaSavings,
      state: stateSavings,
      total: totalTaxSavings,
    },
    projections: {
      year1,
      year5,
      year10,
      retirement,
    },
    tripleTaxAdvantage,
    benefits,
    considerations,
    recommendation,
  };
}

/**
 * Calculate future value of annual HSA contributions
 */
function calculateFutureValue(
  annualContribution: number,
  annualReturn: number,
  years: number
): number {
  let balance = 0;
  for (let year = 0; year < years; year++) {
    balance = (balance + annualContribution) * (1 + annualReturn);
  }
  return Math.round(balance);
}

/**
 * Compare HDHP + HSA vs Traditional plan
 */
export function compareHDHPvsPPO(
  hdhpPremium: number,
  hdhpDeductible: number,
  ppoPremium: number,
  ppoDeductible: number,
  hsaContribution: number,
  estimatedAnnualMedicalCosts: number
): {
  hdhpTotalCost: number;
  ppoTotalCost: number;
  netDifference: number;
  recommendation: string;
} {
  // HDHP costs
  const hdhpAnnualPremium = hdhpPremium * 12;
  const hdhpOutOfPocket = Math.min(estimatedAnnualMedicalCosts, hdhpDeductible);
  const hdhpTaxSavings = hsaContribution * 0.30; // Assume 30% effective tax rate
  const hdhpTotalCost = hdhpAnnualPremium + hdhpOutOfPocket - hdhpTaxSavings;

  // PPO costs
  const ppoAnnualPremium = ppoPremium * 12;
  const ppoOutOfPocket = Math.min(estimatedAnnualMedicalCosts * 0.2, ppoDeductible); // Assume 20% coinsurance
  const ppoTotalCost = ppoAnnualPremium + ppoOutOfPocket;

  const netDifference = hdhpTotalCost - ppoTotalCost;

  let recommendation = '';
  if (netDifference < -1000) {
    recommendation = `HDHP + HSA saves you $${Math.abs(netDifference).toLocaleString()}/year. Great choice for your situation!`;
  } else if (netDifference < 500) {
    recommendation = `HDHP and PPO cost about the same. HDHP wins due to HSA tax benefits and long-term growth potential.`;
  } else {
    recommendation = `PPO costs $${Math.abs(netDifference).toLocaleString()} less given your expected medical costs. Consider PPO unless you want HSA's long-term benefits.`;
  }

  return {
    hdhpTotalCost,
    ppoTotalCost,
    netDifference,
    recommendation,
  };
}

/**
 * Get HSA usage strategies
 */
export function getHSAStrategies(): {
  strategy: string;
  description: string;
  bestFor: string;
}[] {
  return [
    {
      strategy: 'Max Out & Invest',
      description: 'Contribute maximum annually ($8,300 family), invest in index funds, pay medical costs out-of-pocket. Let HSA grow tax-free for retirement.',
      bestFor: 'High earners with emergency fund who can afford to not touch HSA',
    },
    {
      strategy: 'Strategic Contributions',
      description: 'Contribute enough to cover expected medical costs ($2,000-4,000/year). Use HSA to pay current medical bills.',
      bestFor: 'Middle-income families who need HSA for current medical expenses',
    },
    {
      strategy: 'Employer Match Max',
      description: 'Contribute at least enough to get full employer match (if offered). Increase contributions as budget allows.',
      bestFor: 'Anyone with employer HSA match (free money!)',
    },
    {
      strategy: 'Catch-Up Power',
      description: 'Age 55+: Max out with catch-up contributions ($9,300 family). Use as retirement medical fund.',
      bestFor: 'Pre-retirees building medical expense fund for retirement',
    },
  ];
}
