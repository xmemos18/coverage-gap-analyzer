'use client';

interface ComparisonFeature {
  name: string;
  primary: {
    value: string;
    icon: 'check' | 'cross' | 'warning' | 'dash';
  };
  alternative: {
    value: string;
    icon: 'check' | 'cross' | 'warning' | 'dash';
  };
}

interface QuickComparisonTableProps {
  primaryOption: {
    name: string;
  };
  alternativeOption: {
    name: string;
  };
  features: ComparisonFeature[];
  recommendation: string;
  isMobile?: boolean;
}

export default function QuickComparisonTable({
  primaryOption,
  alternativeOption,
  features,
  recommendation,
}: QuickComparisonTableProps) {
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'check':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'cross':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return <span className="text-gray-400">—</span>;
    }
  };

  return (
    <section className="mt-8 md:mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Comparison</h2>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-900">Feature</th>
              <th className="text-left p-4 font-semibold text-blue-600">{primaryOption.name}</th>
              <th className="text-left p-4 font-semibold text-gray-700">{alternativeOption.name}</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, idx) => (
              <tr
                key={idx}
                className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="p-4 font-medium text-gray-900">{feature.name}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {getIcon(feature.primary.icon)}
                    <span className="text-gray-700">{feature.primary.value}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {getIcon(feature.alternative.icon)}
                    <span className="text-gray-700">{feature.alternative.value}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {features.map((feature, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4 text-base">{feature.name}</h4>

            <div className="space-y-4">
              {/* Primary Option */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6">{getIcon(feature.primary.icon)}</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{primaryOption.name}</p>
                  <p className="font-medium text-sm text-gray-900">{feature.primary.value}</p>
                </div>
              </div>

              {/* Alternative Option */}
              <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                <div className="flex-shrink-0 w-6 h-6">{getIcon(feature.alternative.icon)}</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{alternativeOption.name}</p>
                  <p className="font-medium text-sm text-gray-900">{feature.alternative.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendation Callout */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 md:p-5">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-1">Our Recommendation:</p>
            <p className="text-sm text-blue-800 leading-relaxed">{recommendation}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
