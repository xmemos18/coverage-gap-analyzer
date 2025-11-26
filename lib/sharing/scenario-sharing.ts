/**
 * Scenario Sharing Service
 *
 * Provides utilities for encoding/decoding coverage scenarios into shareable URLs.
 * Uses compression and base64url encoding for URL-safe strings.
 */

import { z } from 'zod';

/**
 * Shareable scenario data schema
 */
export const ShareableScenarioSchema = z.object({
  // Version for forward compatibility
  v: z.number().default(1),

  // Core demographics
  zip: z.string(),
  state: z.string().length(2),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(15),
  ages: z.array(z.number()), // All ages combined

  // Health profile
  chronic: z.boolean().default(false),
  tobacco: z.boolean().default(false),
  prescriptions: z.number().min(0).max(50).default(0),
  doctorVisits: z.number().min(0).max(100).default(0),
  specialistVisits: z.number().min(0).max(100).default(0),

  // Financial
  income: z.number().min(0),
  budget: z.number().min(0).optional(),

  // Coverage preferences
  priority: z.enum(['low-premium', 'balanced', 'comprehensive']).default('balanced'),
  planType: z.enum(['any', 'hmo', 'ppo', 'epo', 'hdhp']).default('any'),

  // Optional employer info
  hasEmployer: z.boolean().default(false),
  employerContribution: z.number().optional(),

  // Current coverage (optional)
  currentPremium: z.number().optional(),
  currentDeductible: z.number().optional(),

  // Timestamp
  ts: z.number().optional(), // Unix timestamp
});

export type ShareableScenario = z.infer<typeof ShareableScenarioSchema>;

/**
 * Compressed key mapping for shorter URLs
 */
const KEY_MAP = {
  v: 'v',
  zip: 'z',
  state: 's',
  adults: 'a',
  children: 'c',
  ages: 'g',
  chronic: 'h',
  tobacco: 't',
  prescriptions: 'p',
  doctorVisits: 'd',
  specialistVisits: 'sv',
  income: 'i',
  budget: 'b',
  priority: 'pr',
  planType: 'pt',
  hasEmployer: 'he',
  employerContribution: 'ec',
  currentPremium: 'cp',
  currentDeductible: 'cd',
  ts: 'ts',
} as const;

const REVERSE_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

/**
 * Value mapping for common enums
 */
const PRIORITY_MAP: Record<string, number> = {
  'low-premium': 0,
  balanced: 1,
  comprehensive: 2,
};

const REVERSE_PRIORITY_MAP: Record<number, string> = {
  0: 'low-premium',
  1: 'balanced',
  2: 'comprehensive',
};

const PLAN_TYPE_MAP: Record<string, number> = {
  any: 0,
  hmo: 1,
  ppo: 2,
  epo: 3,
  hdhp: 4,
};

const REVERSE_PLAN_TYPE_MAP: Record<number, string> = {
  0: 'any',
  1: 'hmo',
  2: 'ppo',
  3: 'epo',
  4: 'hdhp',
};

/**
 * Compress scenario to minimal JSON
 */
function compressScenario(scenario: ShareableScenario): Record<string, unknown> {
  const compressed: Record<string, unknown> = {};

  // Always include version
  compressed[KEY_MAP.v] = scenario.v || 1;

  // Required fields
  compressed[KEY_MAP.zip] = scenario.zip;
  compressed[KEY_MAP.state] = scenario.state;
  compressed[KEY_MAP.adults] = scenario.adults;
  compressed[KEY_MAP.children] = scenario.children;
  compressed[KEY_MAP.ages] = scenario.ages;
  compressed[KEY_MAP.income] = scenario.income;

  // Optional boolean fields (only include if true)
  if (scenario.chronic) compressed[KEY_MAP.chronic] = 1;
  if (scenario.tobacco) compressed[KEY_MAP.tobacco] = 1;
  if (scenario.hasEmployer) compressed[KEY_MAP.hasEmployer] = 1;

  // Optional numeric fields (only include if non-zero)
  if (scenario.prescriptions) compressed[KEY_MAP.prescriptions] = scenario.prescriptions;
  if (scenario.doctorVisits) compressed[KEY_MAP.doctorVisits] = scenario.doctorVisits;
  if (scenario.specialistVisits) compressed[KEY_MAP.specialistVisits] = scenario.specialistVisits;
  if (scenario.budget) compressed[KEY_MAP.budget] = scenario.budget;
  if (scenario.employerContribution) compressed[KEY_MAP.employerContribution] = scenario.employerContribution;
  if (scenario.currentPremium) compressed[KEY_MAP.currentPremium] = scenario.currentPremium;
  if (scenario.currentDeductible) compressed[KEY_MAP.currentDeductible] = scenario.currentDeductible;

  // Enum fields (use numeric mapping)
  if (scenario.priority !== 'balanced') {
    compressed[KEY_MAP.priority] = PRIORITY_MAP[scenario.priority];
  }
  if (scenario.planType !== 'any') {
    compressed[KEY_MAP.planType] = PLAN_TYPE_MAP[scenario.planType];
  }

  // Timestamp
  if (scenario.ts) compressed[KEY_MAP.ts] = scenario.ts;

  return compressed;
}

/**
 * Decompress minimal JSON back to scenario
 */
function decompressScenario(compressed: Record<string, unknown>): ShareableScenario {
  return {
    v: (compressed[KEY_MAP.v] as number) || 1,
    zip: compressed[KEY_MAP.zip] as string,
    state: compressed[KEY_MAP.state] as string,
    adults: compressed[KEY_MAP.adults] as number,
    children: compressed[KEY_MAP.children] as number,
    ages: compressed[KEY_MAP.ages] as number[],
    chronic: compressed[KEY_MAP.chronic] === 1,
    tobacco: compressed[KEY_MAP.tobacco] === 1,
    prescriptions: (compressed[KEY_MAP.prescriptions] as number) || 0,
    doctorVisits: (compressed[KEY_MAP.doctorVisits] as number) || 0,
    specialistVisits: (compressed[KEY_MAP.specialistVisits] as number) || 0,
    income: compressed[KEY_MAP.income] as number,
    budget: compressed[KEY_MAP.budget] as number | undefined,
    priority: REVERSE_PRIORITY_MAP[compressed[KEY_MAP.priority] as number] as 'low-premium' | 'balanced' | 'comprehensive' || 'balanced',
    planType: REVERSE_PLAN_TYPE_MAP[compressed[KEY_MAP.planType] as number] as 'any' | 'hmo' | 'ppo' | 'epo' | 'hdhp' || 'any',
    hasEmployer: compressed[KEY_MAP.hasEmployer] === 1,
    employerContribution: compressed[KEY_MAP.employerContribution] as number | undefined,
    currentPremium: compressed[KEY_MAP.currentPremium] as number | undefined,
    currentDeductible: compressed[KEY_MAP.currentDeductible] as number | undefined,
    ts: compressed[KEY_MAP.ts] as number | undefined,
  };
}

/**
 * Encode scenario to URL-safe base64 string
 */
export function encodeScenario(scenario: ShareableScenario): string {
  // Validate input
  const validated = ShareableScenarioSchema.parse(scenario);

  // Compress to minimal JSON
  const compressed = compressScenario(validated);

  // Convert to JSON string
  const json = JSON.stringify(compressed);

  // Encode to base64url (URL-safe base64)
  const base64 = Buffer.from(json, 'utf-8').toString('base64url');

  return base64;
}

/**
 * Decode URL-safe base64 string to scenario
 */
export function decodeScenario(encoded: string): ShareableScenario {
  try {
    // Decode from base64url
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');

    // Parse JSON
    const compressed = JSON.parse(json) as Record<string, unknown>;

    // Decompress to full scenario
    const scenario = decompressScenario(compressed);

    // Validate result
    return ShareableScenarioSchema.parse(scenario);
  } catch {
    throw new Error('Invalid scenario data');
  }
}

/**
 * Generate a shareable URL for a scenario
 */
export function generateShareableUrl(
  scenario: ShareableScenario,
  baseUrl: string = ''
): string {
  const encoded = encodeScenario({
    ...scenario,
    ts: scenario.ts || Date.now(),
  });

  return `${baseUrl}/share/${encoded}`;
}

/**
 * Extract and decode scenario from a shareable URL
 */
export function parseShareableUrl(url: string): ShareableScenario | null {
  try {
    // Handle full URLs or just paths
    const path = url.includes('://') ? new URL(url).pathname : url;

    // Extract encoded part from /share/{encoded}
    const match = path.match(/\/share\/([A-Za-z0-9_-]+)$/);
    if (!match || !match[1]) return null;

    return decodeScenario(match[1]);
  } catch {
    return null;
  }
}

/**
 * Create a short hash for scenario identification
 */
export function createScenarioHash(scenario: ShareableScenario): string {
  const json = JSON.stringify({
    zip: scenario.zip,
    adults: scenario.adults,
    children: scenario.children,
    ages: scenario.ages,
    income: scenario.income,
  });

  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < json.length; i++) {
    hash = (hash * 33) ^ json.charCodeAt(i);
  }

  // Convert to base36 for shorter string
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Validate if a string is a valid encoded scenario
 */
export function isValidEncodedScenario(encoded: string): boolean {
  try {
    decodeScenario(encoded);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get scenario summary for display
 */
export function getScenarioSummary(scenario: ShareableScenario): string {
  const household = [];
  if (scenario.adults === 1) {
    household.push('1 adult');
  } else {
    household.push(`${scenario.adults} adults`);
  }
  if (scenario.children > 0) {
    household.push(scenario.children === 1 ? '1 child' : `${scenario.children} children`);
  }

  const location = `${scenario.zip}, ${scenario.state}`;
  const income = `$${scenario.income.toLocaleString()}/year`;

  return `${household.join(', ')} in ${location} | Income: ${income}`;
}

// Export key maps for testing
export const _internal = {
  KEY_MAP,
  REVERSE_KEY_MAP,
  compressScenario,
  decompressScenario,
};
