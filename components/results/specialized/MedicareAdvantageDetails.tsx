import { MedicareAdvantageAnalysis } from '@/types/specializedAnalyses';

interface MedicareAdvantageDetailsProps {
  analysis: MedicareAdvantageAnalysis;
}

export default function MedicareAdvantageDetails({ analysis }: MedicareAdvantageDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Pros and Cons */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <span aria-label="Checkmark">✅</span> Benefits
          </h5>
          <ul className="space-y-2 text-sm text-gray-700">
            {analysis.analysis.pros.map((pro: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-green-600 flex-shrink-0" aria-hidden="true">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h5 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
            <span aria-label="Warning">⚠️</span> Drawbacks
          </h5>
          <ul className="space-y-2 text-sm text-gray-700">
            {analysis.analysis.cons.map((con: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-orange-600 flex-shrink-0" aria-hidden="true">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Red Flags */}
      {analysis.analysis.redFlags.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <span aria-label="Alert">🚨</span> Important Considerations
          </h5>
          <ul className="space-y-2 text-sm text-gray-800">
            {analysis.analysis.redFlags.map((flag: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-red-600 flex-shrink-0" aria-hidden="true">•</span>
                <span className="font-medium">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comparison */}
      <div className="bg-white rounded-lg p-6 border border-blue-200">
        <h5 className="font-semibold text-lg text-gray-900 mb-4">Quick Comparison</h5>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h6 className="font-semibold text-blue-900 mb-2">Original Medicare + Medigap</h6>
            <ul className="space-y-1 text-sm text-gray-700">
              {analysis.comparison.medigapAdvantages.map((adv: string, idx: number) => (
                <li key={idx}>• {adv}</li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="font-semibold text-indigo-900 mb-2">Medicare Advantage</h6>
            <ul className="space-y-1 text-sm text-gray-700">
              {analysis.comparison.medicareAdvantageAdvantages.map((adv: string, idx: number) => (
                <li key={idx}>• {adv}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-gray-800 bg-blue-50 p-3 rounded border border-blue-200">
          <strong>Recommendation:</strong> {analysis.comparison.recommendation}
        </p>
      </div>

      {/* Shopping Tips */}
      <div className="bg-white rounded-lg p-6 border border-blue-200">
        <h5 className="font-semibold text-lg text-gray-900 mb-4">
          <span aria-label="Light bulb">💡</span> Shopping Tips
        </h5>
        <ul className="space-y-2 text-sm text-gray-700">
          {analysis.shoppingTips.map((tip: string, idx: number) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
