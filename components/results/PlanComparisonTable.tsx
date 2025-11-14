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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-2xl p-6 md:p-8 mb-12 md:mb-16 print:shadow-none print:border-2">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      <div className="relative mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-3xl md:text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
            📊
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            Side-by-Side Plan Comparison
          </h3>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left p-4 md:p-5 font-bold text-gray-900 text-base bg-gradient-to-r from-gray-50 to-slate-50">
                Feature
              </th>
              <th className="text-left p-4 md:p-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/30 backdrop-blur-sm rotate-12">
                    <span className="text-base">✅</span>
                  </div>
                  <span className="font-bold text-white drop-shadow-md">Recommended</span>
                </div>
              </th>
              {topAlternatives.map((alt, idx) => (
                <th key={idx} className="text-left p-4 md:p-5 font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-slate-50">
                  Alternative {idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Premium Plan Names Row */}
            <tr className="border-b-2 border-gray-200">
              <td className="p-4 md:p-5 font-bold text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50">
                Plan Type
              </td>
              <td className="p-4 md:p-5 bg-gradient-to-br from-blue-100 to-indigo-100 border-l-4 border-blue-600">
                <span className="font-bold text-blue-900">{recommended.recommendedInsurance}</span>
              </td>
              {topAlternatives.map((alt, idx) => (
                <td key={idx} className="p-4 md:p-5 bg-white font-semibold text-gray-800">
                  {alt.name}
                </td>
              ))}
            </tr>

            {/* Premium Comparison Rows */}
            {comparisonRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-gray-200 transition-colors hover:bg-blue-50/30 ${
                  rowIdx % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-gray-50/50 to-slate-50/50'
                }`}
              >
                <td className="p-4 md:p-5 font-bold text-gray-800">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-slate-100 mr-2 text-base">
                    {row.icon}
                  </span>
                  {row.feature}
                </td>
                <td className="p-4 md:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-600 font-semibold text-gray-900">
                  {row.recommended}
                </td>
                {row.alternatives.map((altValue, altIdx) => (
                  <td key={altIdx} className="p-4 md:p-5 text-gray-800 font-medium">
                    {altValue}
                  </td>
                ))}
              </tr>
            ))}

            {/* Premium Key Advantages Row */}
            <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
              <td className="p-4 md:p-5 font-bold text-gray-800">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white mr-2 text-base">
                  ✅
                </span>
                Key Advantages
              </td>
              <td className="p-4 md:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-600">
                <ul className="text-sm space-y-2">
                  {getKeyAdvantages(recommended.recommendedInsurance).map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-800 font-medium">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      {adv}
                    </li>
                  ))}
                </ul>
              </td>
              {topAlternatives.map((alt, idx) => (
                <td key={idx} className="p-4 md:p-5 bg-white">
                  <ul className="text-sm space-y-2">
                    {getKeyAdvantages(alt.name).map((adv, advIdx) => (
                      <li key={advIdx} className="flex items-start gap-2 text-gray-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold flex-shrink-0 mt-0.5">
                          {advIdx + 1}
                        </span>
                        {adv}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Premium Trade-offs Row */}
            <tr className="bg-gradient-to-r from-orange-50/50 to-amber-50/50">
              <td className="p-4 md:p-5 font-bold text-gray-800">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white mr-2 text-base">
                  ⚠️
                </span>
                Trade-offs
              </td>
              <td className="p-4 md:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-600">
                <ul className="text-sm space-y-2">
                  {getTradeoffs(recommended.recommendedInsurance).map((tradeoff, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      {tradeoff}
                    </li>
                  ))}
                </ul>
              </td>
              {topAlternatives.map((alt, idx) => (
                <td key={idx} className="p-4 md:p-5 bg-white">
                  <ul className="text-sm space-y-2">
                    {getTradeoffs(alt.name).map((tradeoff, tradeoffIdx) => (
                      <li key={tradeoffIdx} className="flex items-start gap-2 text-gray-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex-shrink-0 mt-0.5">
                          {tradeoffIdx + 1}
                        </span>
                        {tradeoff}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Premium Footer Callout */}
      <div className="relative mt-8 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 p-5 md:p-6 shadow-md">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        ></div>
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl shadow-lg rotate-3 flex-shrink-0">
            💡
          </div>
          <div>
            <p className="text-sm md:text-base text-gray-800 font-medium leading-relaxed">
              <strong className="text-blue-900">How to use this table:</strong> Compare features side-by-side to see why we
              recommended the first option. The recommended plan offers the best balance of cost,
              coverage, and flexibility for your multi-state lifestyle.
            </p>
          </div>
        </div>
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
