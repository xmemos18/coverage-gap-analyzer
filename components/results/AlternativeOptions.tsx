import { memo } from 'react';
import { formatCost } from '@/lib/results-utils';
import InsuranceText from '@/components/InsuranceText';
import { AlternativeOption } from '@/types';

interface AlternativeOptionsProps {
  options: AlternativeOption[];
}

function AlternativeOptions({ options }: AlternativeOptionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-3xl">🔍</span>
        Other Options to Consider
      </h3>
      <div className="space-y-6">
        {options.map((option, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-accent transition-colors"
          >
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
              <h4 className="text-xl font-bold text-gray-900 mb-2 md:mb-0">
                <InsuranceText text={option.name} position="bottom" />
              </h4>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-700">
                  {formatCost(option.monthlyCost.low, option.monthlyCost.high)}
                </div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros */}
              <div>
                <h5 className="font-semibold text-success mb-3 flex items-center gap-2">
                  <span>✓</span> Pros
                </h5>
                <ul className="space-y-2">
                  {option.pros.map((pro, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-success flex-shrink-0 mt-1">•</span>
                      <span><InsuranceText text={pro} position="bottom" /></span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>−</span> Cons
                </h5>
                <ul className="space-y-2">
                  {option.cons.map((con, i) => (
                    <li key={i} className="text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 flex-shrink-0 mt-1">•</span>
                      <span><InsuranceText text={con} position="bottom" /></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(AlternativeOptions);
