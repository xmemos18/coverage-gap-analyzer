/**
 * Monte Carlo Simulation Web Worker
 *
 * Runs healthcare cost simulations in a separate thread to avoid blocking the UI.
 * Uses lognormal distribution (standard for healthcare costs).
 */

// Types for worker communication
interface MonteCarloInput {
  baseCost: number;
  deductible: number;
  outOfPocketMax: number;
  iterations: number;
  seed?: number;
  sigma?: number; // Standard deviation for lognormal (default 0.5)
}

interface MonteCarloResult {
  median: number;
  mean: number;
  standardDeviation: number;
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
  probabilityOfExceedingDeductible: number;
  probabilityOfHittingOOPMax: number;
  expectedValueAtRisk: number; // VaR at 95%
  simulationCount: number;
  executionTimeMs: number;
}

// Seeded random number generator (Mulberry32)
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for generating normal random numbers
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

// Calculate healthcare cost outcome for a given medical expense
function calculateOutcome(
  medicalExpense: number,
  deductible: number,
  outOfPocketMax: number
): number {
  // Apply deductible
  let outOfPocket = Math.min(medicalExpense, deductible);

  // After deductible, coinsurance typically applies (20% of remaining)
  const afterDeductible = Math.max(0, medicalExpense - deductible);
  const coinsurance = afterDeductible * 0.2; // 20% coinsurance

  outOfPocket += coinsurance;

  // Cap at out-of-pocket maximum
  return Math.min(outOfPocket, outOfPocketMax);
}

// Main simulation function
function runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResult {
  const startTime = performance.now();

  const {
    baseCost,
    deductible,
    outOfPocketMax,
    iterations,
    seed = Date.now(),
    sigma = 0.5, // Default standard deviation for lognormal
  } = input;

  // Initialize random number generator
  const random = mulberry32(seed);

  // Calculate lognormal parameters
  // mu is set so that the median of the lognormal equals baseCost
  const mu = Math.log(baseCost);

  // Run simulations
  const results: number[] = [];
  let exceedsDeductible = 0;
  let hitsOOPMax = 0;

  for (let i = 0; i < iterations; i++) {
    // Generate random medical expense from lognormal distribution
    const medicalExpense = lognormalRandom(mu, sigma, random);

    // Calculate actual out-of-pocket cost
    const outOfPocket = calculateOutcome(medicalExpense, deductible, outOfPocketMax);

    results.push(outOfPocket);

    // Track probabilities
    if (medicalExpense > deductible) {
      exceedsDeductible++;
    }
    if (outOfPocket >= outOfPocketMax * 0.95) {
      // Within 5% of OOP max
      hitsOOPMax++;
    }
  }

  // Sort results for percentile calculations
  results.sort((a, b) => a - b);

  // Calculate statistics
  const sum = results.reduce((a, b) => a + b, 0);
  const mean = sum / iterations;

  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / iterations;
  const standardDeviation = Math.sqrt(variance);

  // Calculate percentiles
  const getPercentile = (p: number): number => {
    const index = Math.floor((p / 100) * (iterations - 1));
    return results[index] ?? 0;
  };

  const endTime = performance.now();

  return {
    median: getPercentile(50),
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
    expectedValueAtRisk: Math.round(getPercentile(95)), // VaR at 95%
    simulationCount: iterations,
    executionTimeMs: Math.round(endTime - startTime),
  };
}

// Web Worker message handler
self.onmessage = function (event: MessageEvent<MonteCarloInput>) {
  const result = runMonteCarloSimulation(event.data);
  self.postMessage(result);
};

// Export for testing (won't be used in worker context)
export { runMonteCarloSimulation };
export type { MonteCarloInput, MonteCarloResult };
