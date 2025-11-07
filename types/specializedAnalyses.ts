// Type definitions for specialized insurance analyses

export interface MedicareAdvantageAnalysis {
  analysis: {
    isGoodFit: boolean;
    confidenceLevel: string;
    reasoning: string[];
    pros: string[];
    cons: string[];
    redFlags: string[];
  };
  comparison: {
    medigapAdvantages: string[];
    medicareAdvantageAdvantages: string[];
    recommendation: string;
  };
  shoppingTips: string[];
}

export interface COBRAAnalysis {
  analysis: {
    isWorthIt: boolean;
    recommendation: string;
    warnings: string[];
    estimatedMonthlyCost: { low: number; high: number };
    monthsRemaining: number;
    pros: string[];
    cons: string[];
    alternatives: string[];
  };
  flowchart: Array<{
    question: string;
    yesPath: string;
    noPath: string;
  }>;
}

export interface HSAAnalysis {
  analysis: {
    tripleTaxAdvantage: string[];
    contributionLimits: {
      individual: number;
      family: number;
      catchUp: number;
    };
    maxContribution: number;
    taxSavings: {
      federal: number;
      fica: number;
      state: number;
      total: number;
    };
    projections: {
      year1: number;
      year5: number;
      year10: number;
      retirement: number;
    };
    recommendation: string;
    benefits: string[];
    considerations: string[];
  };
  strategies: Array<{
    strategy: string;
    description: string;
    bestFor: string;
  }>;
}
