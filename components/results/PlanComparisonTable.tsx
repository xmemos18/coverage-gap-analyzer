'use client';

import { InsuranceRecommendation, AlternativeOption } from '@/types';

interface PlanComparisonTableProps {
  recommended: InsuranceRecommendation;
  alternatives: AlternativeOption[];
}

interface ComparisonRow {
  feature: string;
  recommended: string;
  alternatives: string[];
  icon: string;
}

export default function PlanComparisonTable({ recommended, alternatives }: PlanComparisonTableProps) {
  // Limit to top 2 alternatives for cleaner display
  const topAlternatives = alternatives.slice(0, 2);

  const comparisonRows: ComparisonRow[] = [
    {
      feature: 'Monthly Cost',
      icon: '💰',
      recommended: `$${recommended.estimatedMonthlyCost.low}-${recommended.estimatedMonthlyCost.high}`,
      alternatives: topAlternatives.map(alt =>
        `$${alt.monthlyCost.low}-${alt.monthlyCost.high}`
      ),
    },
    {
      feature: 'Coverage Score',
      icon: '⭐',
      recommended: `${recommended.coverageGapScore}/10`,
      alternatives: topAlternatives.map(alt => `${alt.coverageScore}/10`),
    },
    {
      feature: 'Best For',
      icon: '🎯',
      recommended: getBestForText(recommended.recommendedInsurance),
      alternatives: topAlternatives.map(alt => getBestForText(alt.name)),
    },
    {
      feature: 'Network Type',
      icon: '🏥',
      recommended: getNetworkType(recommended.recommendedInsurance),
      alternatives: topAlternatives.map(alt => getNetworkType(alt.name)),
    },
    {
      feature: 'Multi-State Coverage',
      icon: '🗺️',
      recommended: getMultiStateSupport(recommended.recommendedInsurance),
      alternatives: topAlternatives.map(alt => getMultiStateSupport(alt.name)),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 print:shadow-none print:border-2">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-3xl">📊</span>
        Side-by-Side Plan Comparison
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left p-4 font-semibold text-gray-700">Feature</th>
              <th className="text-left p-4 font-semibold text-primary bg-blue-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span>Recommended</span>
                </div>
              </th>
              {topAlternatives.map((alt, idx) => (
                <th key={idx} className="text-left p-4 font-semibold text-gray-700">
                  Alternative {idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Plan Names */}
            <tr className="border-b border-gray-100">
              <td className="p-4 font-medium text-gray-600">Plan Type</td>
              <td className="p-4 bg-blue-50 font-semibold text-primary">
                {recommended.recommendedInsurance}
              </td>
              {topAlternatives.map((alt, idx) => (
                <td key={idx} className="p-4 text-gray-700">
                  {alt.name}
                </td>
              ))}
            </tr>

            {/* Comparison Rows */}
            {comparisonRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-600">
                  <span className="mr-2">{row.icon}</span>
                  {row.feature}
                </td>
                <td className="p-4 bg-blue-50 font-medium text-gray-900">
                  {row.recommended}
                </td>
                {row.alternatives.map((altValue, altIdx) => (
                  <td key={altIdx} className="p-4 text-gray-700">
                    {altValue}
                  </td>
                ))}
              </tr>
            ))}

            {/* Pros/Cons */}
            <tr className="border-b border-gray-100">
              <td className="p-4 font-medium text-gray-600">
                <span className="mr-2">✅</span>
                Key Advantages
              </td>
              <td className="p-4 bg-blue-50">
                <ul className="text-sm space-y-1">
                  {getKeyAdvantages(recommended.recommendedInsurance).map((adv, idx) => (
                    <li key={idx} className="text-gray-700">• {adv}</li>
                  ))}
                </ul>
              </td>
              {topAlternatives.map((alt, idx) => (
                <td key={idx} className="p-4">
                  <ul className="text-sm space-y-1">
                    {getKeyAdvantages(alt.name).map((adv, advIdx) => (
                      <li key={advIdx} className="text-gray-700">• {adv}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-4 font-medium text-gray-600">
                <span className="mr-2">⚠️</span>
                Trade-offs
              </td>
              <td className="p-4 bg-blue-50">
                <ul className="text-sm space-y-1">
                  {getTradeoffs(recommended.recommendedInsurance).map((tradeoff, idx) => (
                    <li key={idx} className="text-gray-600">• {tradeoff}</li>
                  ))}
                </ul>
              </td>
              {topAlternatives.map((alt, idx) => (
                <td key={idx} className="p-4">
                  <ul className="text-sm space-y-1">
                    {getTradeoffs(alt.name).map((tradeoff, tradeoffIdx) => (
                      <li key={tradeoffIdx} className="text-gray-600">• {tradeoff}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>💡 How to use this table:</strong> Compare features side-by-side to see why we
          recommended the first option. The recommended plan offers the best balance of cost,
          coverage, and flexibility for your multi-state lifestyle.
        </p>
      </div>
    </div>
  );
}

// Helper functions
function getBestForText(planName: string): string {
  if (planName.includes('Medicare') && planName.includes('Extra Coverage')) {
    return 'Seniors needing nationwide coverage';
  }
  if (planName.includes('Medigap')) {
    return 'Seniors needing nationwide coverage';
  }
  if (planName.includes('Medicare Advantage')) {
    return 'Seniors in one location';
  }
  if (planName.includes('Family')) {
    return 'Families with children';
  }
  if (planName.includes('Couples')) {
    return 'Two adults, no children';
  }
  if (planName.includes('HDHP') || planName.includes('High-Deductible')) {
    return 'Healthy individuals seeking savings';
  }
  return 'Multi-state residents';
}

function getNetworkType(planName: string): string {
  if (planName.includes('Medicare') && !planName.includes('Advantage')) {
    return 'Any doctor accepting Medicare (99%+ of doctors)';
  }
  if (planName.includes('PPO') || planName.includes('Flexible')) {
    return 'Large network, no referrals needed';
  }
  if (planName.includes('HMO')) {
    return 'Local network, referrals required';
  }
  if (planName.includes('Medicare Advantage')) {
    return 'Network varies by plan (HMO or PPO)';
  }
  return 'Nationwide network';
}

function getMultiStateSupport(planName: string): string {
  if (planName.includes('Medicare') && !planName.includes('Advantage')) {
    return 'Excellent - works in all 50 states';
  }
  if (planName.includes('PPO') || planName.includes('Flexible') || planName.includes('National')) {
    return 'Good - nationwide network';
  }
  if (planName.includes('HMO')) {
    return 'Limited - local area only';
  }
  if (planName.includes('Medicare Advantage')) {
    return 'Limited - usually one county';
  }
  return 'Varies by plan';
}

function getKeyAdvantages(planName: string): string[] {
  if (planName.includes('Medicare') && planName.includes('Extra Coverage')) {
    return [
      'Works everywhere in the US',
      'No network restrictions',
      'Predictable costs',
      'No referrals needed',
    ];
  }
  if (planName.includes('Medicare Advantage')) {
    return [
      'All-in-one plan',
      'Often includes dental/vision',
      'Lower premiums',
      'Drug coverage included',
    ];
  }
  if (planName.includes('HDHP') || planName.includes('High-Deductible')) {
    return [
      'Lowest premiums',
      'HSA tax benefits',
      'Good for healthy people',
      'Triple tax advantage',
    ];
  }
  if (planName.includes('PPO') || planName.includes('Flexible')) {
    return [
      'Large provider network',
      'No referrals needed',
      'Out-of-network coverage',
      'Multi-state friendly',
    ];
  }
  if (planName.includes('HMO')) {
    return [
      'Lower premiums',
      'Coordinated care',
      'Lower copays',
      'Preventive care focus',
    ];
  }
  return ['Comprehensive coverage', 'Multi-state support'];
}

function getTradeoffs(planName: string): string[] {
  if (planName.includes('Medicare') && planName.includes('Extra Coverage')) {
    return [
      'Higher premiums than Medicare Advantage',
      'Separate Part D for prescriptions',
    ];
  }
  if (planName.includes('Medicare Advantage')) {
    return [
      'Network restrictions',
      'Not ideal for multi-state',
      'May need referrals',
    ];
  }
  if (planName.includes('HDHP') || planName.includes('High-Deductible')) {
    return [
      'High deductible ($3,000-$6,000)',
      'Pay more upfront for care',
      'Not ideal for chronic conditions',
    ];
  }
  if (planName.includes('HMO')) {
    return [
      'Must use network providers',
      'Referrals required',
      'Limited multi-state coverage',
    ];
  }
  if (planName.includes('PPO') || planName.includes('Flexible')) {
    return [
      'Higher premiums than HMO',
      'Higher deductibles',
    ];
  }
  return ['May have network limitations'];
}
