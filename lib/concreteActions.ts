/**
 * Concrete Action Steps
 * Generates detailed, step-by-step instructions with links, deadlines, and contact info
 */

interface ActionStep {
  title: string;
  steps: string[];
  links?: { text: string; url: string }[];
  help?: string;
  deadline?: string;
}

/**
 * Get enrollment deadlines and urgency messages
 */
export function getEnrollmentDeadlines(): {
  medicare: string;
  marketplace: string;
  urgency: string;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Medicare Open Enrollment: Oct 15 - Dec 7
  const medicareStart = new Date(currentYear, 9, 15); // Oct 15
  const medicareEnd = new Date(currentYear, 11, 7); // Dec 7

  // ACA Marketplace: Nov 1 - Jan 15
  const marketplaceStart = new Date(currentYear, 10, 1); // Nov 1
  const marketplaceEnd = new Date(currentYear + 1, 0, 15); // Jan 15 next year

  let medicareDeadline = '';
  let marketplaceDeadline = '';
  let urgency = '';

  // Check Medicare enrollment period
  if (now >= medicareStart && now <= medicareEnd) {
    medicareDeadline = '⏰ Medicare Open Enrollment is NOW (ends Dec 7)';
    urgency = '🔥 Urgent: Enroll before Dec 7!';
  } else if (currentMonth < 9) {
    medicareDeadline = `Medicare Open Enrollment: Oct 15 - Dec 7, ${currentYear}`;
  } else {
    medicareDeadline = `Medicare Open Enrollment: Oct 15 - Dec 7, ${currentYear + 1}`;
  }

  // Check Marketplace enrollment period
  if (now >= marketplaceStart && now <= marketplaceEnd) {
    marketplaceDeadline = '⏰ Marketplace Open Enrollment is NOW (ends Jan 15)';
    urgency = urgency || '🔥 Urgent: Enroll before Jan 15!';
  } else if (currentMonth < 10) {
    marketplaceDeadline = `Marketplace Open Enrollment: Nov 1 - Jan 15, ${currentYear + 1}`;
  } else {
    marketplaceDeadline = `Marketplace Open Enrollment: Nov 1 - Jan 15, ${currentYear + 1}`;
  }

  return {
    medicare: medicareDeadline,
    marketplace: marketplaceDeadline,
    urgency: urgency || 'Open Enrollment runs Nov 1 - Jan 15 each year',
  };
}

/**
 * Generate concrete Medigap shopping steps
 */
export function getMedigapShoppingSteps(zipCode?: string): ActionStep {
  const zip = zipCode || '10001';

  return {
    title: '📋 How to Shop for Medigap (Step-by-Step)',
    steps: [
      '**Step 1: Visit Medicare.gov Plan Finder**',
      `→ Go to medicare.gov/plan-compare`,
      `→ Enter your ZIP code: ${zip}`,
      '',
      '**Step 2: Filter for Medigap Plans**',
      `→ Select "Medicare Supplement Insurance (Medigap)"`,
      `→ Choose "Plan G" or "Plan N" (most popular)`,
      '',
      '**Step 3: Compare Prices**',
      '→ Look at at least 3 companies',
      '→ Choose the cheapest - all Plan G coverage is identical by law',
      `→ Plan G typically costs $125-200/month depending on your area`,
      '',
      '**Step 4: Enroll**',
      '→ Best time: Within 6 months of turning 65 (guaranteed issue period)',
      '→ No medical questions during this period',
      '→ Coverage starts the 1st of the month after you enroll',
    ],
    links: [
      { text: 'Medicare.gov Plan Finder', url: 'https://www.medicare.gov/plan-compare' },
      { text: 'Medigap Plan Comparison', url: 'https://www.medicare.gov/supplements-other-insurance/whats-medicare-supplement-insurance-medigap' },
    ],
    help: 'Need help? Call 1-800-MEDICARE (1-800-633-4227), available 24/7',
    deadline: getEnrollmentDeadlines().medicare,
  };
}

/**
 * Generate concrete Medicare Part D steps
 */
export function getPartDShoppingSteps(zipCode?: string): ActionStep {
  const zip = zipCode || '10001';

  return {
    title: '💊 How to Shop for Part D Prescription Coverage',
    steps: [
      '**Step 1: Gather Your Medications**',
      '→ Make a list of all your prescriptions (name, dosage, frequency)',
      '→ Include any over-the-counter drugs your doctor recommends',
      '',
      '**Step 2: Use the Medicare Plan Finder**',
      `→ Go to medicare.gov/plan-compare`,
      `→ Enter ZIP code: ${zip}`,
      `→ Select "Medicare drug plans"`,
      '',
      '**Step 3: Enter Your Medications**',
      '→ Add each prescription from your list',
      '→ Include your preferred pharmacy',
      `→ The tool will show which plans cover YOUR specific drugs`,
      '',
      '**Step 4: Compare Total Costs**',
      `→ Don't just look at premiums - check total cost with your drugs`,
      '→ Verify your drugs are on the plan formulary (covered list)',
      '→ Check if you need prior authorization',
      '',
      '**Step 5: Enroll**',
      '→ Enroll online, by phone, or through the insurance company',
      `→ Coverage starts Jan 1 if you enroll during Open Enrollment`,
    ],
    links: [
      { text: 'Medicare Drug Plan Finder', url: 'https://www.medicare.gov/plan-compare' },
      { text: 'Understanding Part D', url: 'https://www.medicare.gov/drug-coverage-part-d' },
    ],
    help: 'Need help? Call 1-800-MEDICARE or your State Health Insurance Assistance Program (SHIP)',
    deadline: getEnrollmentDeadlines().medicare,
  };
}

/**
 * Generate concrete marketplace shopping steps
 */
export function getMarketplaceShoppingSteps(
  _zipCode?: string,
  state?: string
): ActionStep {
  const stateExchanges: Record<string, { name: string; url: string }> = {
    CA: { name: 'Covered California', url: 'https://www.coveredca.com' },
    NY: { name: 'NY State of Health', url: 'https://nystateofhealth.ny.gov' },
    MA: { name: 'Massachusetts Health Connector', url: 'https://www.mahealthconnector.org' },
    WA: { name: 'Washington Healthplanfinder', url: 'https://www.wahealthplanfinder.org' },
    CO: { name: 'Connect for Health Colorado', url: 'https://connectforhealthco.com' },
    CT: { name: 'Access Health CT', url: 'https://www.accesshealthct.com' },
    MD: { name: 'Maryland Health Connection', url: 'https://www.marylandhealthconnection.gov' },
    MN: { name: 'MNsure', url: 'https://www.mnsure.org' },
    NV: { name: 'Nevada Health Link', url: 'https://www.nevadahealthlink.com' },
    NJ: { name: 'Get Covered New Jersey', url: 'https://www.getcoverednj.gov' },
    PA: { name: 'Pennie', url: 'https://www.pennie.com' },
    RI: { name: 'HealthSource RI', url: 'https://healthsourceri.com' },
    VT: { name: 'Vermont Health Connect', url: 'https://www.vermorthealthconnect.gov' },
  };

  const stateExchange = state ? stateExchanges[state.toUpperCase()] : null;
  const marketplace = stateExchange || { name: 'HealthCare.gov', url: 'https://www.healthcare.gov' };

  return {
    title: '🏥 How to Shop for Marketplace Insurance',
    steps: [
      '**Step 1: Create an Account**',
      `→ Go to ${marketplace.name}: ${marketplace.url}`,
      `→ Click "Get Coverage" or "Apply Now"`,
      '→ Create an account with email and password',
      '',
      '**Step 2: Fill Out Application**',
      `→ Enter household information (everyone who needs coverage)`,
      '→ Provide income information for subsidy calculation',
      `→ Takes about 20-30 minutes`,
      '',
      '**Step 3: Compare Plans**',
      `→ You'll see Bronze, Silver, Gold, and Platinum tiers`,
      '→ Bronze = lowest premiums, highest deductibles',
      '→ Silver = best value for most people (eligible for cost-sharing subsidies)',
      '→ Gold/Platinum = higher premiums, lower deductibles',
      '',
      '**Step 4: Check Your Subsidy**',
      '→ Application will show your estimated subsidy amount',
      `→ Applied automatically to lower your monthly premium`,
      '→ Can also apply at tax time',
      '',
      '**Step 5: Enroll**',
      '→ Select your plan and confirm enrollment',
      `→ Pay first month's premium to activate coverage`,
      '→ Coverage typically starts the 1st of the next month',
    ],
    links: [
      { text: marketplace.name, url: marketplace.url },
      { text: 'HealthCare.gov (Federal Exchange)', url: 'https://www.healthcare.gov' },
      { text: 'Find Local Help', url: 'https://localhelp.healthcare.gov' },
    ],
    help: `Need help? Call the Marketplace Call Center: 1-800-318-2596 (TTY: 1-855-889-4325)`,
    deadline: getEnrollmentDeadlines().marketplace,
  };
}

/**
 * Generate Medicaid application steps
 */
export function getMedicaidApplicationSteps(
  state: string,
  medicaidUrl?: string
): ActionStep {
  const url = medicaidUrl || 'https://www.medicaid.gov';
  const stateNames: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
    IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
    ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
    MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
    PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
    TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
    WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  };

  const stateName = stateNames[state.toUpperCase()] || state;

  return {
    title: '🏥 How to Apply for Medicaid',
    steps: [
      '**Step 1: Gather Documents**',
      '→ Proof of income (pay stubs, tax returns, SSI/SSDI letters)',
      '→ Proof of residency (utility bill, lease, mortgage statement)',
      '→ Proof of citizenship/legal status (birth certificate, passport, green card)',
      `→ Social Security numbers for everyone applying`,
      '',
      '**Step 2: Apply Online**',
      `→ Visit ${stateName} Medicaid website: ${url}`,
      `→ Or apply through HealthCare.gov/Medicaid`,
      '→ Fill out application (takes 30-45 minutes)',
      '',
      '**Step 3: Submit Application**',
      '→ Upload your documents or mail them in',
      `→ Application will be reviewed within 45 days (usually faster)`,
      '→ You may get a call or letter asking for more information',
      '',
      '**Step 4: Get Approved**',
      '→ If approved, coverage can start immediately',
      `→ You'll receive a Medicaid card in the mail`,
      '→ Find a doctor who accepts Medicaid',
      '',
      '**Alternative: Apply in Person**',
      `→ Visit your local ${stateName} Medicaid office`,
      '→ Call ahead for hours and required documents',
      '→ Bring all documentation with you',
    ],
    links: [
      { text: `${stateName} Medicaid`, url: url },
      { text: 'Apply via HealthCare.gov', url: 'https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/' },
    ],
    help: `Need help? Call ${stateName} Medicaid office or visit a local health center`,
    deadline: '⏰ Apply anytime - Medicaid has no enrollment deadline!',
  };
}

/**
 * Generate employer coverage comparison steps
 */
export function getEmployerComparisonSteps(): ActionStep {
  return {
    title: '💼 How to Compare Employer vs Marketplace Coverage',
    steps: [
      '**Step 1: Get Your Employer Plan Details**',
      '→ Request a Summary of Benefits and Coverage (SBC) from HR',
      '→ Note the monthly premium (your cost after employer contribution)',
      `→ Note the deductible and out-of-pocket maximum`,
      '→ Check the provider network',
      '',
      '**Step 2: Calculate Affordability**',
      '→ Your premium should be less than 9.12% of household income',
      `→ Example: $50,000 income → $380/month max for "affordable"`,
      '→ If higher, you MAY qualify for marketplace subsidies',
      '',
      '**Step 3: Shop the Marketplace**',
      '→ Go to HealthCare.gov and fill out an application',
      '→ See if you qualify for subsidies',
      `→ Compare total costs: premiums + deductibles + copays`,
      '',
      '**Step 4: Compare Networks**',
      '→ Check if your doctors are in both networks',
      '→ Employer plans often have better networks',
      '→ Marketplace may be cheaper but more limited',
      '',
      '**Step 5: Make Your Decision**',
      '→ Consider total cost, not just premiums',
      `→ Factor in employer HSA/FSA contributions`,
      '→ Think about convenience and coverage quality',
    ],
    help: 'Need help? Consult a health insurance navigator or broker (free service)',
  };
}

/**
 * Format action steps for display
 */
export function formatActionStep(step: ActionStep): string {
  let formatted = `${step.title}\n\n`;
  formatted += step.steps.join('\n');

  if (step.deadline) {
    formatted += `\n\n${step.deadline}`;
  }

  if (step.help) {
    formatted += `\n\n${step.help}`;
  }

  return formatted;
}
