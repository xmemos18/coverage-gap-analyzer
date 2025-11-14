import { COBRAAnalysis } from '@/types/specializedAnalyses';

interface COBRADetailsProps {
  analysis: COBRAAnalysis;
}

export default function COBRADetails({ analysis }: COBRADetailsProps) {
  return (
    <div className="space-y-6">
      {/* Premium Warnings */}
      {analysis.analysis.warnings.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md rotate-3">
              ⚠️
            </div>
            <h5 className="font-bold text-red-900 text-lg">Important Warnings</h5>
          </div>
          <div className="space-y-3">
            {analysis.analysis.warnings.map((warning: string, idx: number) => (
              <div key={idx} className="flex gap-2.5 text-sm text-gray-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  !
                </span>
                <span className="font-semibold leading-relaxed">{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Pros and Cons Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md rotate-3">
              ✅
            </div>
            <h5 className="font-bold text-green-900 text-lg">Pros of COBRA</h5>
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
            <h5 className="font-bold text-orange-900 text-lg">Cons of COBRA</h5>
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

      {/* Premium Decision Flowchart */}
      <div className="relative overflow-hidden rounded-xl bg-white border-2 border-blue-200 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl shadow-sm rotate-2">
            🗺️
          </div>
          <h5 className="font-bold text-xl text-gray-900">COBRA Decision Guide</h5>
        </div>
        <div className="space-y-4">
          {analysis.flowchart.map((step, idx: number) => (
            <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
              <div className="flex gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0 shadow-md">
                  {idx + 1}
                </span>
                <p className="font-bold text-gray-900 text-base leading-relaxed">{step.question}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
                <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">
                      ✓
                    </span>
                    <strong className="text-green-900">Yes</strong>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{step.yesPath}</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white text-xs font-bold">
                      ✗
                    </span>
                    <strong className="text-gray-900">No</strong>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{step.noPath}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Alternatives */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 p-5 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md rotate-3">
            🔄
          </div>
          <h5 className="font-bold text-purple-900 text-lg">Alternatives to COBRA</h5>
        </div>
        <ul className="space-y-2.5">
          {analysis.analysis.alternatives.map((alt: string, idx: number) => (
            <li key={idx} className="flex gap-2.5 text-sm text-gray-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{alt}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
