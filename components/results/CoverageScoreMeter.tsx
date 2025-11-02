import { getScoreColor } from '@/lib/results-utils';

interface CoverageScoreMeterProps {
  score: number;
}

export default function CoverageScoreMeter({ score }: CoverageScoreMeterProps) {
  const scoreColor = getScoreColor(score);

  return (
    <div className="flex-shrink-0">
      <div className="relative">
        <div className={`w-32 h-32 rounded-full ${scoreColor.bg} flex items-center justify-center`}>
          <div className="bg-white w-24 h-24 rounded-full flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold ${scoreColor.text} flex items-center gap-1`}>
              <span className="text-2xl" aria-hidden="true">{scoreColor.icon}</span>
              {score}
            </div>
            <div className="text-xs text-gray-600 font-semibold">
              {scoreColor.label}
            </div>
          </div>
        </div>
        <div className="text-center mt-2 text-sm font-semibold text-gray-600">
          Coverage Score
        </div>
      </div>
    </div>
  );
}
