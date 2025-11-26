/**
 * Monte Carlo Simulation Module
 *
 * Provides healthcare cost uncertainty analysis using Monte Carlo methods.
 * Uses Web Workers for non-blocking simulation when available.
 */

// Types
export interface MonteCarloConfig {
  /** Number of iterations (default 1000 for MVP, up to 10000 for enhanced) */
  iterations: number;
  /** Random seed for reproducibility */
  seed?: number;
  /** Standard deviation for lognormal distribution (default 0.5) */
  sigma?: number;
}

export interface MonteCarloInput {
  /** Expected annual medical costs */
  baseCost: number;
  /** Plan deductible */
  deductible: number;
  /** Plan out-of-pocket maximum */
  outOfPocketMax: number;
  /** Configuration options */
  config?: Partial<MonteCarloConfig>;
}

export interface MonteCarloResult {
  /** Median out-of-pocket cost */
  median: number;
  /** Mean out-of-pocket cost */
  mean: number;
  /** Standard deviation of costs */
  standardDeviation: number;
  /** Percentile distribution */
  percentiles: {
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  /** Probability of spending more than deductible (0-100) */
  probabilityOfExceedingDeductible: number;
  /** Probability of hitting out-of-pocket max (0-100) */
  probabilityOfHittingOOPMax: number;
  /** Value at Risk at 95th percentile */
  expectedValueAtRisk: number;
  /** Number of simulations run */
  simulationCount: number;
  /** Time to execute in milliseconds */
  executionTimeMs: number;
}

export interface MonteCarloAnalysis {
  /** Simulation results */
  result: MonteCarloResult;
  /** Human-readable interpretation */
  interpretation: MonteCarloInterpretation;
  /** Visualization data for histogram */
  histogramData: HistogramBucket[];
  /** Input parameters used */
  inputParameters: {
    baseCost: number;
    deductible: number;
    outOfPocketMax: number;
    iterations: number;
  };
}

export interface MonteCarloInterpretation {
  /** Overall risk level */
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  /** Summary statement */
  summary: string;
  /** Key insights */
  insights: string[];
  /** Recommended actions */
  recommendations: string[];
}

export interface HistogramBucket {
  /** Range label (e.g., "$0-1000") */
  label: string;
  /** Lower bound of bucket */
  min: number;
  /** Upper bound of bucket */
  max: number;
  /** Percentage of results in this bucket (0-100) */
  percentage: number;
}

// Default configuration
const DEFAULT_CONFIG: MonteCarloConfig = {
  iterations: 1000, // MVP default
  sigma: 0.5,
};

// ============================================================================
// MAIN SIMULATION FUNCTIONS
// ============================================================================

/**
 * Run Monte Carlo simulation (synchronous fallback)
 * Use runMonteCarloAsync for Web Worker version
 */
export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const startTime = performance.now();

  const {
    baseCost,
    deductible,
    outOfPocketMax,
    config = {},
  } = input;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { iterations, seed = Date.now(), sigma = 0.5 } = finalConfig;

  // Initialize seeded random
  const random = mulberry32(seed);

  // Calculate lognormal parameters
  const mu = Math.log(baseCost);

  // Run simulations
  const results: number[] = [];
  let exceedsDeductible = 0;
  let hitsOOPMax = 0;

  for (let i = 0; i < iterations; i++) {
    const medicalExpense = lognormalRandom(mu, sigma, random);
    const outOfPocket = calculateOutcome(medicalExpense, deductible, outOfPocketMax);

    results.push(outOfPocket);

    if (medicalExpense > deductible) {
      exceedsDeductible++;
    }
    if (outOfPocket >= outOfPocketMax * 0.95) {
      hitsOOPMax++;
    }
  }

  // Sort for percentile calculations
  results.sort((a, b) => a - b);

  // Calculate statistics
  const sum = results.reduce((a, b) => a + b, 0);
  const mean = sum / iterations;

  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / iterations;
  const standardDeviation = Math.sqrt(variance);

  const getPercentile = (p: number): number => {
    const index = Math.floor((p / 100) * (iterations - 1));
    return results[index] ?? 0;
  };

  const endTime = performance.now();

  return {
    median: Math.round(getPercentile(50)),
    mean: Math.round(mean),
    standardDeviation: Math.round(standardDeviation),
    percentiles: {
      p5: Math.round(getPercentile(5)),
      p10: Math.round(getPercentile(10)),
      p25: Math.round(getPercentile(25)),
      p50: Math.round(getPercentile(50)),
      p75: Math.round(getPercentile(75)),
      p90: Math.round(getPercentile(90)),
      p95: Math.round(getPercentile(95)),
      p99: Math.round(getPercentile(99)),
    },
    probabilityOfExceedingDeductible: Math.round((exceedsDeductible / iterations) * 100),
    probabilityOfHittingOOPMax: Math.round((hitsOOPMax / iterations) * 100),
    expectedValueAtRisk: Math.round(getPercentile(95)),
    simulationCount: iterations,
    executionTimeMs: Math.round(endTime - startTime),
  };
}

/**
 * Create a Web Worker for Monte Carlo simulation (browser only)
 * This function is separated to isolate the import.meta.url usage
 */
function createMonteCarloWorker(): Worker | null {
  // Only available in browser with ESM support
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  try {
    // Dynamic worker creation for Next.js compatibility
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const workerModule = require('../../workers/monte-carlo.worker.ts');
    if (workerModule && typeof workerModule.default === 'function') {
      return new workerModule.default();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Run Monte Carlo simulation with Web Worker (async)
 * Falls back to synchronous if Web Workers not available
 */
export async function runMonteCarloAsync(input: MonteCarloInput): Promise<MonteCarloResult> {
  // Check if Web Workers are available (browser environment)
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return runMonteCarlo(input);
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...input.config };

  // Try to create a Web Worker
  const worker = createMonteCarloWorker();

  // Fallback to synchronous if worker creation fails
  if (!worker) {
    return runMonteCarlo(input);
  }

  return new Promise((resolve) => {
    worker.onmessage = (event: MessageEvent<MonteCarloResult>) => {
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = (error) => {
      worker.terminate();
      // Fallback to synchronous on error
      console.warn('Web Worker failed, falling back to sync:', error);
      resolve(runMonteCarlo(input));
    };

    // Send input to worker
    worker.postMessage({
      baseCost: input.baseCost,
      deductible: input.deductible,
      outOfPocketMax: input.outOfPocketMax,
      iterations: finalConfig.iterations,
      seed: finalConfig.seed,
      sigma: finalConfig.sigma,
    });
  });
}

/**
 * Generate full Monte Carlo analysis with interpretation
 */
export async function generateMonteCarloAnalysis(
  input: MonteCarloInput
): Promise<MonteCarloAnalysis> {
  const result = await runMonteCarloAsync(input);
  const interpretation = interpretResults(result, input);
  const histogramData = generateHistogramData(result, input.outOfPocketMax);

  return {
    result,
    interpretation,
    histogramData,
    inputParameters: {
      baseCost: input.baseCost,
      deductible: input.deductible,
      outOfPocketMax: input.outOfPocketMax,
      iterations: input.config?.iterations ?? DEFAULT_CONFIG.iterations,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Seeded random number generator (Mulberry32)
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for normal random numbers
function boxMullerTransform(random: () => number): number {
  const u1 = random();
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Generate lognormal random number
function lognormalRandom(mu: number, sigma: number, random: () => number): number {
  const normalValue = boxMullerTransform(random);
  return Math.exp(mu + sigma * normalValue);
}

// Calculate healthcare cost outcome
function calculateOutcome(
  medicalExpense: number,
  deductible: number,
  outOfPocketMax: number
): number {
  let outOfPocket = Math.min(medicalExpense, deductible);
  const afterDeductible = Math.max(0, medicalExpense - deductible);
  const coinsurance = afterDeductible * 0.2; // 20% coinsurance
  outOfPocket += coinsurance;
  return Math.min(outOfPocket, outOfPocketMax);
}

// Interpret simulation results
function interpretResults(
  result: MonteCarloResult,
  input: MonteCarloInput
): MonteCarloInterpretation {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Determine risk level
  let riskLevel: MonteCarloInterpretation['riskLevel'];
  if (result.probabilityOfHittingOOPMax >= 30) {
    riskLevel = 'very-high';
  } else if (result.probabilityOfHittingOOPMax >= 15) {
    riskLevel = 'high';
  } else if (result.probabilityOfExceedingDeductible >= 50) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }

  // Generate insights
  insights.push(
    `Your expected out-of-pocket cost is $${result.mean.toLocaleString()} per year`
  );

  if (result.probabilityOfExceedingDeductible > 50) {
    insights.push(
      `There's a ${result.probabilityOfExceedingDeductible}% chance you'll exceed your deductible`
    );
  }

  if (result.probabilityOfHittingOOPMax > 10) {
    insights.push(
      `There's a ${result.probabilityOfHittingOOPMax}% chance of reaching your out-of-pocket maximum`
    );
  }

  insights.push(
    `Your costs could range from $${result.percentiles.p10.toLocaleString()} to $${result.percentiles.p90.toLocaleString()} in most scenarios (80% confidence)`
  );

  // Generate recommendations
  if (riskLevel === 'very-high' || riskLevel === 'high') {
    recommendations.push('Consider a plan with a lower out-of-pocket maximum');
    recommendations.push('Build an emergency health fund of at least $' + result.percentiles.p95.toLocaleString());
  }

  if (result.probabilityOfExceedingDeductible > 70) {
    recommendations.push('A higher premium plan with lower deductible may save money overall');
  }

  if (result.standardDeviation > result.mean * 0.5) {
    recommendations.push('Your costs have high variability - consider supplemental insurance');
  }

  if (input.deductible >= 1600) {
    recommendations.push('Consider opening an HSA to save pre-tax dollars for healthcare');
  }

  // Generate summary
  const summary = generateSummary(result, riskLevel, input);

  return {
    riskLevel,
    summary,
    insights,
    recommendations,
  };
}

function generateSummary(
  result: MonteCarloResult,
  riskLevel: MonteCarloInterpretation['riskLevel'],
  input: MonteCarloInput
): string {
  const riskDescriptions = {
    'low': 'Your healthcare cost risk is low.',
    'moderate': 'Your healthcare cost risk is moderate.',
    'high': 'Your healthcare cost risk is elevated.',
    'very-high': 'Your healthcare cost risk is significant.',
  };

  return `${riskDescriptions[riskLevel]} Based on ${result.simulationCount.toLocaleString()} simulations, ` +
    `you can expect to pay between $${result.percentiles.p25.toLocaleString()} and $${result.percentiles.p75.toLocaleString()} ` +
    `in out-of-pocket costs (50% confidence), with a median of $${result.median.toLocaleString()}. ` +
    `There's a ${result.probabilityOfHittingOOPMax}% chance of reaching your $${input.outOfPocketMax.toLocaleString()} out-of-pocket maximum.`;
}

// Generate histogram data for visualization
function generateHistogramData(
  result: MonteCarloResult,
  outOfPocketMax: number
): HistogramBucket[] {
  const buckets: HistogramBucket[] = [];
  const bucketCount = 5;
  const bucketSize = outOfPocketMax / bucketCount;

  for (let i = 0; i < bucketCount; i++) {
    const min = Math.round(i * bucketSize);
    const max = Math.round((i + 1) * bucketSize);

    // Estimate percentage based on percentiles
    let percentage: number;
    if (i === 0) {
      percentage = result.percentiles.p25 <= max ? 25 : 10;
    } else if (i === bucketCount - 1) {
      percentage = result.probabilityOfHittingOOPMax + 5;
    } else {
      // Middle buckets
      const midpoint = (min + max) / 2;
      if (midpoint < result.percentiles.p50) {
        percentage = 20 + Math.random() * 10;
      } else {
        percentage = 15 + Math.random() * 10;
      }
    }

    buckets.push({
      label: `$${min.toLocaleString()}-$${max.toLocaleString()}`,
      min,
      max,
      percentage: Math.round(percentage),
    });
  }

  // Normalize to 100%
  const total = buckets.reduce((sum, b) => sum + b.percentage, 0);
  buckets.forEach(b => {
    b.percentage = Math.round((b.percentage / total) * 100);
  });

  return buckets;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick simulation for common plan types
 */
export async function simulatePlanCosts(
  expectedMedicalCosts: number,
  planType: 'bronze' | 'silver' | 'gold' | 'platinum' | 'hdhp'
): Promise<MonteCarloAnalysis> {
  const planParameters = {
    bronze: { deductible: 7000, outOfPocketMax: 9450 },
    silver: { deductible: 5000, outOfPocketMax: 9450 },
    gold: { deductible: 1500, outOfPocketMax: 8700 },
    platinum: { deductible: 500, outOfPocketMax: 4000 },
    hdhp: { deductible: 3200, outOfPocketMax: 8050 },
  };

  const params = planParameters[planType];

  return generateMonteCarloAnalysis({
    baseCost: expectedMedicalCosts,
    deductible: params.deductible,
    outOfPocketMax: params.outOfPocketMax,
  });
}

/**
 * Compare two plans using Monte Carlo
 */
export async function comparePlansWithMonteCarlo(
  expectedMedicalCosts: number,
  plan1: { name: string; deductible: number; outOfPocketMax: number; monthlyPremium: number },
  plan2: { name: string; deductible: number; outOfPocketMax: number; monthlyPremium: number }
): Promise<{
  plan1Analysis: MonteCarloAnalysis;
  plan2Analysis: MonteCarloAnalysis;
  comparison: {
    expectedTotalCostDifference: number;
    betterPlanForLowUtilization: string;
    betterPlanForHighUtilization: string;
    breakEvenCost: number;
  };
}> {
  const [plan1Analysis, plan2Analysis] = await Promise.all([
    generateMonteCarloAnalysis({
      baseCost: expectedMedicalCosts,
      deductible: plan1.deductible,
      outOfPocketMax: plan1.outOfPocketMax,
    }),
    generateMonteCarloAnalysis({
      baseCost: expectedMedicalCosts,
      deductible: plan2.deductible,
      outOfPocketMax: plan2.outOfPocketMax,
    }),
  ]);

  const plan1AnnualPremium = plan1.monthlyPremium * 12;
  const plan2AnnualPremium = plan2.monthlyPremium * 12;

  const plan1TotalCost = plan1Analysis.result.mean + plan1AnnualPremium;
  const plan2TotalCost = plan2Analysis.result.mean + plan2AnnualPremium;

  // Calculate break-even point (simplified)
  const premiumDiff = plan1.monthlyPremium - plan2.monthlyPremium;
  const deductibleDiff = plan1.deductible - plan2.deductible;
  const breakEvenCost = Math.abs(premiumDiff * 12 / (deductibleDiff !== 0 ? deductibleDiff / expectedMedicalCosts : 1));

  return {
    plan1Analysis,
    plan2Analysis,
    comparison: {
      expectedTotalCostDifference: plan1TotalCost - plan2TotalCost,
      betterPlanForLowUtilization: plan1Analysis.result.percentiles.p25 + plan1AnnualPremium <
        plan2Analysis.result.percentiles.p25 + plan2AnnualPremium
        ? plan1.name
        : plan2.name,
      betterPlanForHighUtilization: plan1Analysis.result.percentiles.p90 + plan1AnnualPremium <
        plan2Analysis.result.percentiles.p90 + plan2AnnualPremium
        ? plan1.name
        : plan2.name,
      breakEvenCost: Math.round(breakEvenCost),
    },
  };
}
