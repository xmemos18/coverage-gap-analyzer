import { COBRAAnalysis } from '@/types/specializedAnalyses';

interface COBRADetailsProps {
  analysis: COBRAAnalysis;
}

export default function COBRADetails({ analysis }: COBRADetailsProps) {
  return (
    <div className="space-y-6">
      {/* Warnings */}
      {analysis.analysis.warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {analysis.analysis.warnings.map((warning: string, idx: number) => (
            <p key={idx} className="text-red-800 font-semibold">
              <span aria-label="Warning" role="img">⚠️</span> {warning}
            </p>
          ))}
        </div>
      )}

      {/* Pros and Cons Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-lg p-5 border border-green-200">
          <h5 className="font-semibold text-lg text-green-900 mb-3">
            <span aria-label="Check mark" role="img">✅</span> Pros of COBRA
          </h5>
          <ul className="space-y-2">
            {analysis.analysis.pros.map((pro: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 rounded-lg p-5 border border-red-200">
          <h5 className="font-semibold text-lg text-red-900 mb-3">
            <span aria-label="Cross mark" role="img">❌</span> Cons of COBRA
          </h5>
          <ul className="space-y-2">
            {analysis.analysis.cons.map((con: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Decision Flowchart */}
      <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
        <h5 className="font-semibold text-lg text-blue-900 mb-4">
          <span aria-label="Map" role="img">🗺️</span> COBRA Decision Guide
        </h5>
        <div className="space-y-4">
          {analysis.flowchart.map((step, idx: number) => (
            <div key={idx} className="bg-white rounded p-4 border border-blue-200">
              <p className="font-semibold text-gray-900 mb-2">{step.question}</p>
              <div className="grid md:grid-cols-2 gap-3 mt-2 text-sm">
                <div className="text-green-700 bg-green-50 rounded p-2">
                  <strong>Yes:</strong> {step.yesPath}
                </div>
                <div className="text-gray-700 bg-gray-50 rounded p-2">
                  <strong>No:</strong> {step.noPath}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternatives */}
      <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
        <h5 className="font-semibold text-lg text-purple-900 mb-3">
          <span aria-label="Repeat" role="img">🔄</span> Alternatives to COBRA
        </h5>
        <ul className="space-y-2">
          {analysis.analysis.alternatives.map((alt: string, idx: number) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">→</span>
              <span>{alt}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
