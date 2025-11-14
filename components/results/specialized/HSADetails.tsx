import { HSAAnalysis } from '@/types/specializedAnalyses';

interface HSADetailsProps {
  analysis: HSAAnalysis;
}

export default function HSADetails({ analysis }: HSADetailsProps) {
  return (
    <div className="space-y-6">
      {/* Premium Triple Tax Advantage */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl shadow-md rotate-3">
            🎯
          </div>
          <h4 className="font-bold text-xl text-gray-900">Triple Tax Advantage</h4>
        </div>
        <div className="space-y-3">
          {analysis.analysis.tripleTaxAdvantage.map((advantage: string, idx: number) => (
            <div key={idx} className="flex items-start gap-3 bg-white/60 rounded-lg p-3 border border-blue-200/50">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0 shadow-sm">
                {idx + 1}
              </span>
              <div className="flex-1">
                <span className="text-blue-600 font-bold text-base">{advantage.split(' ')[0]}</span>
                <span className="text-gray-800 ml-1 leading-relaxed">{advantage.substring(advantage.indexOf(' ') + 1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Contribution Limits & Tax Savings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md rotate-3">
              📊
            </div>
            <h5 className="font-bold text-blue-900 text-lg">2024 Contribution Limits</h5>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-1">Individual Coverage</p>
              <p className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                ${analysis.analysis.contributionLimits.individual.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-1">Family Coverage</p>
              <p className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                ${analysis.analysis.contributionLimits.family.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md rotate-3">
              💵
            </div>
            <h5 className="font-bold text-green-900 text-lg">Your Annual Tax Savings</h5>
          </div>
          <div className="space-y-2.5 mb-3">
            <div className="flex justify-between text-sm bg-white/50 rounded-lg p-2">
              <span className="text-gray-700 font-medium">Federal Tax:</span>
              <span className="font-bold text-gray-900">${analysis.analysis.taxSavings.federal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm bg-white/50 rounded-lg p-2">
              <span className="text-gray-700 font-medium">FICA Tax:</span>
              <span className="font-bold text-gray-900">${analysis.analysis.taxSavings.fica.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm bg-white/50 rounded-lg p-2">
              <span className="text-gray-700 font-medium">State Tax:</span>
              <span className="font-bold text-gray-900">${analysis.analysis.taxSavings.state.toLocaleString()}</span>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-3 mt-3 shadow-md">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-white text-base">Total Savings:</span>
                <span className="text-3xl font-bold text-white drop-shadow-md">${analysis.analysis.taxSavings.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Growth Projections */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl shadow-md rotate-3">
            📈
          </div>
          <h5 className="font-bold text-xl text-gray-900">Long-Term Growth Potential</h5>
        </div>
        <p className="text-sm text-gray-700 mb-5 font-medium bg-white/50 rounded-lg p-3">
          If you invest your HSA contributions (7% annual return):
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-gray-600 mb-2">Year 1</p>
            <p className="text-xl md:text-2xl font-bold bg-gradient-to-br from-purple-600 to-indigo-700 bg-clip-text text-transparent">
              ${analysis.analysis.projections.year1.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-gray-600 mb-2">Year 5</p>
            <p className="text-xl md:text-2xl font-bold bg-gradient-to-br from-purple-600 to-indigo-700 bg-clip-text text-transparent">
              ${analysis.analysis.projections.year5.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-gray-600 mb-2">Year 10</p>
            <p className="text-xl md:text-2xl font-bold bg-gradient-to-br from-purple-600 to-indigo-700 bg-clip-text text-transparent">
              ${analysis.analysis.projections.year10.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-center border-2 border-purple-300 shadow-md hover:shadow-lg transition-shadow">
            <p className="text-xs font-bold text-white/90 mb-2">Retirement</p>
            <p className="text-xl md:text-2xl font-bold text-white drop-shadow-md">
              ${analysis.analysis.projections.retirement.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Premium Recommendation */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 border-2 border-yellow-300 p-5 shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white text-2xl shadow-md rotate-3 flex-shrink-0">
            💡
          </div>
          <div className="flex-1">
            <h5 className="font-bold text-yellow-900 text-lg mb-2">Recommendation for You</h5>
            <p className="text-gray-800 leading-relaxed font-medium">{analysis.analysis.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Premium Benefits and Considerations */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md rotate-3">
              ✅
            </div>
            <h5 className="font-bold text-green-900 text-lg">HSA Benefits</h5>
          </div>
          <ul className="space-y-2.5">
            {analysis.analysis.benefits.map((benefit: string, idx: number) => (
              <li key={idx} className="flex gap-2.5 text-sm text-gray-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md rotate-3">
              ⚠️
            </div>
            <h5 className="font-bold text-orange-900 text-lg">Important Considerations</h5>
          </div>
          <ul className="space-y-2.5">
            {analysis.analysis.considerations.map((consideration: string, idx: number) => (
              <li key={idx} className="flex gap-2.5 text-sm text-gray-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{consideration}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Premium HSA Strategies */}
      <div className="relative overflow-hidden rounded-xl bg-white border-2 border-indigo-200 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-2xl shadow-sm rotate-2">
            🎯
          </div>
          <h5 className="font-bold text-xl text-gray-900">HSA Usage Strategies</h5>
        </div>
        <div className="space-y-4">
          {analysis.strategies.map((strategy, idx: number) => (
            <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold flex-shrink-0 shadow-md">
                  {idx + 1}
                </span>
                <h6 className="font-bold text-gray-900 text-base leading-relaxed">{strategy.strategy}</h6>
              </div>
              <p className="text-sm text-gray-800 mb-3 leading-relaxed pl-10">{strategy.description}</p>
              <div className="bg-white/60 rounded-lg p-2.5 pl-10">
                <p className="text-xs text-indigo-700 font-bold flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  <span>Best for: {strategy.bestFor}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
