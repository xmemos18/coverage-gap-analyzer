import { memo } from 'react';
import { formatCost } from '@/lib/results-utils';
import { monthlyCostRangeToAnnual } from '@/lib/costUtils';
import InsuranceTerm from '@/components/InsuranceTerm';
import { CostRange } from '@/types';

interface CostBreakdownProps {
  monthlyCost: CostRange;
}

function CostBreakdown({ monthlyCost }: CostBreakdownProps) {
  const annualCost = monthlyCostRangeToAnnual(monthlyCost);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-3xl">💰</span>
        Cost Breakdown
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-2 border-blue-200">
          <div className="text-sm font-semibold text-gray-600 mb-2">
            Monthly <InsuranceTerm term="Premium">Cost</InsuranceTerm>
          </div>
          <div className="text-4xl font-bold text-primary">
            {formatCost(monthlyCost.low, monthlyCost.high)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border-2 border-green-200">
          <div className="text-sm font-semibold text-gray-600 mb-2">Annual Cost</div>
          <div className="text-4xl font-bold text-success">
            {formatCost(annualCost.low, annualCost.high)}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Costs are estimates and may vary based on your specific situation and chosen provider.
      </p>
    </div>
  );
}

export default memo(CostBreakdown);
