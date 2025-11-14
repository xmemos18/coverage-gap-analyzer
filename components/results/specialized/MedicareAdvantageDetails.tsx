import { MedicareAdvantageAnalysis } from '@/types/specializedAnalyses';

interface MedicareAdvantageDetailsProps {
  analysis: MedicareAdvantageAnalysis;
}

export default function MedicareAdvantageDetails({ analysis }: MedicareAdvantageDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Premium Pros and Cons Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md rotate-3">
              ✅
            </div>
            <h5 className="font-bold text-green-900 text-lg">Benefits</h5>
          </div>
          <ul className="space-y-2.5">
            {analysis.analysis.pros.map((pro: string, idx: number) => (
              <li key={idx} className="flex gap-2.5 text-sm text-gray-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md rotate-3">
              ⚠️
            </div>
            <h5 className="font-bold text-orange-900 text-lg">Drawbacks</h5>
          </div>
          <ul className="space-y-2.5">
            {analysis.analysis.cons.map((con: string, idx: number) => (
              <li key={idx} className="flex gap-2.5 text-sm text-gray-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Premium Red Flags */}
      {analysis.analysis.redFlags.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md rotate-3">
              🚨
            </div>
            <h5 className="font-bold text-red-900 text-lg">Important Considerations</h5>
          </div>
          <ul className="space-y-2.5">
            {analysis.analysis.redFlags.map((flag: string, idx: number) => (
              <li key={idx} className="flex gap-2.5 text-sm text-gray-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  !
                </span>
                <span className="font-semibold leading-relaxed">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Premium Comparison Card */}
      <div className="relative overflow-hidden rounded-xl bg-white border-2 border-blue-200 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl shadow-sm rotate-2">
            ⚖️
          </div>
          <h5 className="font-bold text-xl text-gray-900">Quick Comparison</h5>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-5">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4">
            <h6 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span className="text-lg">🏥</span>
              Original Medicare + Medigap
            </h6>
            <ul className="space-y-2">
              {analysis.comparison.medigapAdvantages.map((adv: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-sm text-gray-800">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 p-4">
            <h6 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <span className="text-lg">💊</span>
              Medicare Advantage
            </h6>
            <ul className="space-y-2">
              {analysis.comparison.medicareAdvantageAdvantages.map((adv: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-sm text-gray-800">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg shadow-md rotate-3 flex-shrink-0">
              💡
            </div>
            <p className="text-sm text-gray-900 font-medium leading-relaxed">
              <strong className="text-blue-900">Recommendation:</strong> {analysis.comparison.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Premium Shopping Tips */}
      <div className="relative overflow-hidden rounded-xl bg-white border-2 border-gray-200 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 text-2xl shadow-sm rotate-2">
            💡
          </div>
          <h5 className="font-bold text-xl text-gray-900">Shopping Tips</h5>
        </div>
        <ul className="space-y-3">
          {analysis.shoppingTips.map((tip: string, idx: number) => (
            <li key={idx} className="flex gap-3 text-sm text-gray-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
