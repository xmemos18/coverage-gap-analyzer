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
    <section className="mb-12 md:mb-16 animate-fadeIn">
      {/* Premium Section Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-3xl md:text-4xl shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
          ⚖️
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Quick Comparison</h2>
      </div>

      {/* Premium Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border-2 border-gray-200 shadow-xl">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50">
            <tr>
              <th className="text-left p-5 font-bold text-gray-900 text-base border-b-2 border-gray-200">
                Feature
              </th>
              <th className="text-left p-5 border-b-2 border-gray-200">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-md">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 rotate-12">
                    ⭐
                  </div>
                  <span className="font-bold text-base">{primaryOption.name}</span>
                </div>
              </th>
              <th className="text-left p-5 font-bold text-gray-700 text-base border-b-2 border-gray-200">
                {alternativeOption.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, idx) => (
              <tr
                key={idx}
                className={`border-t border-gray-200 transition-colors hover:bg-blue-50/50 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-gray-50/50 to-slate-50/50'
                }`}
              >
                <td className="p-5 font-bold text-gray-900">{feature.name}</td>
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    {getIcon(feature.primary.icon)}
                    <span className="text-gray-800 font-medium">{feature.primary.value}</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    {getIcon(feature.alternative.icon)}
                    <span className="text-gray-800 font-medium">{feature.alternative.value}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Premium Mobile Cards */}
      <div className="md:hidden space-y-4">
        {features.map((feature, idx) => (
          <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-5 shadow-lg">
            {/* Subtle background pattern */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}
            ></div>

            <div className="relative">
              <h4 className="font-bold text-gray-900 mb-5 text-lg flex items-center gap-2">
                <span className="text-blue-600">•</span>
                {feature.name}
              </h4>

              <div className="space-y-4">
                {/* Premium Primary Option */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getIcon(feature.primary.icon)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-700">{primaryOption.name}</span>
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-xs rotate-12">
                          ⭐
                        </div>
                      </div>
                      <p className="font-bold text-base text-gray-900">{feature.primary.value}</p>
                    </div>
                  </div>
                </div>

                {/* Premium Alternative Option */}
                <div className="rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getIcon(feature.alternative.icon)}</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-600 mb-1">{alternativeOption.name}</p>
                      <p className="font-bold text-base text-gray-900">{feature.alternative.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Recommendation Callout */}
      <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8 shadow-xl">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}
        ></div>

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl shadow-lg rotate-3 flex-shrink-0">
            💡
          </div>
          <div className="flex-1">
            <p className="font-bold text-blue-900 mb-2 text-lg">Our Recommendation:</p>
            <p className="text-base text-gray-800 leading-relaxed">{recommendation}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
