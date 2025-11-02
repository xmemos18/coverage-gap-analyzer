/**
 * Plain English Translations
 * Converts technical insurance terms to plain English
 */

/**
 * Simplify plan names to be more accessible
 */
export function simplifyPlanName(technicalName: string): string {
  const translations: Record<string, string> = {
    'Original Medicare + Medigap': 'Basic Medicare + Extra Coverage',
    'National PPO Individual Plan': 'Nationwide Flexible Plan',
    'National PPO Couples Plan': 'Nationwide Flexible Plan for Couples',
    'National PPO Family Plan': 'Nationwide Flexible Family Plan',
    'Medicare Advantage': 'All-in-One Medicare Plan',
    'HDHP': 'Low-Premium, High-Deductible Plan',
    'High-Deductible Health Plan': 'Low-Premium, High-Deductible Plan',
  };

  // Check for exact matches
  if (translations[technicalName]) {
    return translations[technicalName];
  }

  // Check for partial matches
  for (const [technical, simple] of Object.entries(translations)) {
    if (technicalName.includes(technical)) {
      return technicalName.replace(technical, simple);
    }
  }

  return technicalName;
}

/**
 * Generate "What this means" section for a plan type
 */
export function generateWhatThisMeans(
  planType: string,
  states: string[],
  isSimpleMode: boolean = false
): string {
  const statesList = states.length > 2
    ? `all ${states.length} of your states`
    : states.join(' and ');

  if (planType.includes('Medicare') && planType.includes('Medigap')) {
    return `What this means:
• See any doctor who accepts Medicare (almost all doctors)
• Works everywhere in the US, including ${statesList}
• No referrals needed to see specialists
• Predictable costs - plan covers most gaps in Medicare
${isSimpleMode ? '' : '• Good if you want maximum flexibility and travel between states'}`;
  }

  if (planType.includes('PPO') || planType.includes('Flexible')) {
    return `What this means:
• See any doctor without permission slips (referrals)
• Works in ${statesList} and nationwide
• Pay more per month, less when you visit doctors
${isSimpleMode ? '' : '• Good if you want flexibility and have doctors you already like'}`;
  }

  if (planType.includes('HMO')) {
    return `What this means:
• Lower monthly cost than PPO
• Need a primary doctor who coordinates your care
• Must get referrals to see specialists
• Only covers care in your network (except emergencies)
• Best if you stay in one area most of the year`;
  }

  if (planType.includes('HDHP') || planType.includes('High-Deductible')) {
    return `What this means:
• Lowest monthly premium (pay less each month)
• Higher deductible (pay more when you need care)
• Can open a Health Savings Account (HSA) for tax savings
• Best if you're healthy and want to save money`;
  }

  if (planType.includes('Medicare Advantage') || planType.includes('All-in-One')) {
    return `What this means:
• One plan covers everything (hospital, doctor, usually prescriptions)
• Often includes extras like dental, vision, hearing
• May have network restrictions (HMO or PPO style)
• Usually lower premiums than Original Medicare + Medigap
• Check if your doctors are in the network`;
  }

  return `What this means:
• This plan works in ${statesList}
• Coverage includes doctor visits, hospital stays, and emergency care
• Preventive care is typically covered at no extra cost`;
}

/**
 * Simplify reasoning text to be more direct
 */
export function simplifyReasoning(technicalReasoning: string): string {
  const replacements: [RegExp, string][] = [
    // Make it more conversational
    [/provides nationwide coverage with no network restrictions/gi, 'works everywhere with any doctor'],
    [/across all \d+ of your states/gi, 'in all your states'],
    [/gives you flexibility to see doctors/gi, 'lets you see any doctor'],
    [/without referrals or network restrictions/gi, 'without needing permission'],
    [/comprehensive coverage/gi, 'complete coverage'],
    [/ensures access to care/gi, 'gives you access to doctors'],
    [/fills the gaps in Original Medicare/gi, 'covers what Medicare doesn\'t'],
    [/works seamlessly everywhere/gi, 'works everywhere'],
    [/Perfect for multi-state residents/gi, 'Great for people with homes in multiple states'],
    [/Perfect for snowbirds/gi, 'Great if you split your time between states'],
  ];

  let simplified = technicalReasoning;
  for (const [pattern, replacement] of replacements) {
    simplified = simplified.replace(pattern, replacement);
  }

  return simplified;
}

/**
 * Generate cost breakdown explanation
 */
export function generateCostBreakdown(monthlyCost: { low: number; high: number }): string {
  const avgCost = Math.round((monthlyCost.low + monthlyCost.high) / 2);

  return `Estimated Monthly Cost: $${monthlyCost.low}-${monthlyCost.high}

This includes:
✓ Doctor visits
✓ Hospital care
✓ Emergency services
✓ Preventive care (usually free)

Not included (pay separately):
• Prescription drugs (add Part D or drug coverage)
• Dental care
• Vision care (except for medical eye problems)
• Long-term care

Annual cost estimate: $${(monthlyCost.low * 12).toLocaleString()} - $${(monthlyCost.high * 12).toLocaleString()}/year
Average: About $${avgCost}/month or $${(avgCost * 12).toLocaleString()}/year`;
}

/**
 * Add "In other words" section for key concepts
 */
export function addInOtherWords(concept: string): string | null {
  const explanations: Record<string, string> = {
    'deductible': 'In other words: This is like a threshold. You pay this amount first, then insurance starts helping more.',
    'coinsurance': 'In other words: After your deductible, you and insurance split the bill. You pay your percentage, they pay theirs.',
    'out-of-pocket maximum': 'In other words: This is your safety net. Once you hit this amount, insurance pays 100% for the rest of the year.',
    'premium': 'In other words: This is your monthly membership fee - you pay it whether you use the insurance or not.',
    'network': 'In other words: These are the doctors and hospitals that give discounts to your insurance members.',
    'referral': 'In other words: A permission slip from your primary doctor to see a specialist.',
  };

  const lowerConcept = concept.toLowerCase();
  for (const [key, explanation] of Object.entries(explanations)) {
    if (lowerConcept.includes(key)) {
      return explanation;
    }
  }

  return null;
}

/**
 * Break down a complex sentence into bullet points
 */
export function sentenceToBullets(sentence: string): string[] {
  // Split on common delimiters
  const parts = sentence.split(/[,;]|(?:\. (?=[A-Z]))/);
  return parts
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => p.replace(/^and /i, '').trim())
    .map(p => p.charAt(0).toUpperCase() + p.slice(1));
}
