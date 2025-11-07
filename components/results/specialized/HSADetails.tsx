import { HSAAnalysis } from '@/types/specializedAnalyses';

interface HSADetailsProps {
  analysis: HSAAnalysis;
}

export default function HSADetails({ analysis }: HSADetailsProps) {
  return (
    <div className="space-y-6">
      {/* Triple Tax Advantage */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-200">
        <h4 className="font-bold text-lg mb-3">
          <span aria-label="Target" role="img">🎯</span> Triple Tax Advantage
        </h4>
        <div className="space-y-2">
          {analysis.analysis.tripleTaxAdvantage.map((advantage: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">{advantage.split(' ')[0]}</span>
              <span className="text-gray-800">{advantage.substring(advantage.indexOf(' ') + 1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution Limits & Tax Savings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
          <h5 className="font-semibold text-lg text-blue-900 mb-3">
            <span aria-label="Bar chart" role="img">📊</span> 2024 Contribution Limits
          </h5>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Individual Coverage</p>
              <p className="text-2xl font-bold text-blue-600">${analysis.analysis.contributionLimits.individual.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Family Coverage</p>
              <p className="text-2xl font-bold text-blue-600">${analysis.analysis.contributionLimits.family.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-5 border border-green-200">
          <h5 className="font-semibold text-lg text-green-900 mb-3">
            <span aria-label="Money with wings" role="img">💵</span> Your Annual Tax Savings
          </h5>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Federal Tax:</span>
              <span className="font-semibold">${analysis.analysis.taxSavings.federal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">FICA Tax:</span>
              <span className="font-semibold">${analysis.analysis.taxSavings.fica.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">State Tax:</span>
              <span className="font-semibold">${analysis.analysis.taxSavings.state.toLocaleString()}</span>
            </div>
            <div className="border-t-2 border-green-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total Savings:</span>
                <span className="text-2xl font-bold text-green-600">${analysis.analysis.taxSavings.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Projections */}
      <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
        <h5 className="font-semibold text-lg text-purple-900 mb-4">
          <span aria-label="Chart increasing" role="img">📈</span> Long-Term Growth Potential
        </h5>
        <p className="text-sm text-gray-600 mb-4">
          If you invest your HSA contributions (7% annual return):
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Year 1</p>
            <p className="text-lg font-bold text-purple-600">${analysis.analysis.projections.year1.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Year 5</p>
            <p className="text-lg font-bold text-purple-600">${analysis.analysis.projections.year5.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Year 10</p>
            <p className="text-lg font-bold text-purple-600">${analysis.analysis.projections.year10.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded p-3 text-center border-2 border-purple-300">
            <p className="text-xs text-gray-600 mb-1">Retirement</p>
            <p className="text-lg font-bold text-purple-600">${analysis.analysis.projections.retirement.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-yellow-50 rounded-lg p-5 border-2 border-yellow-300">
        <h5 className="font-bold text-lg mb-2">
          <span aria-label="Light bulb" role="img">💡</span> Recommendation for You
        </h5>
        <p className="text-gray-800">{analysis.analysis.recommendation}</p>
      </div>

      {/* Benefits and Considerations */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-lg p-5 border border-green-200">
          <h5 className="font-semibold text-lg text-green-900 mb-3">
            <span aria-label="Check mark" role="img">✅</span> HSA Benefits
          </h5>
          <ul className="space-y-2">
            {analysis.analysis.benefits.map((benefit: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
          <h5 className="font-semibold text-lg text-orange-900 mb-3">
            <span aria-label="Warning" role="img">⚠️</span> Important Considerations
          </h5>
          <ul className="space-y-2">
            {analysis.analysis.considerations.map((consideration: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">→</span>
                <span>{consideration}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* HSA Strategies */}
      <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
        <h5 className="font-semibold text-lg text-indigo-900 mb-4">
          <span aria-label="Target" role="img">🎯</span> HSA Usage Strategies
        </h5>
        <div className="space-y-4">
          {analysis.strategies.map((strategy, idx: number) => (
            <div key={idx} className="bg-white rounded p-4 border border-indigo-200">
              <h6 className="font-semibold text-gray-900 mb-1">{strategy.strategy}</h6>
              <p className="text-sm text-gray-700 mb-2">{strategy.description}</p>
              <p className="text-xs text-indigo-600 font-semibold">Best for: {strategy.bestFor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
