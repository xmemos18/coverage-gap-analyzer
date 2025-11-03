'use client';

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface CoverageScoreChartProps {
  scores: {
    affordability: number;
    networkCoverage: number;
    benefitComprehensiveness: number;
    prescriptionCoverage: number;
    outOfPocketProtection: number;
  };
  title?: string;
  height?: number;
}

/**
 * Coverage Score Radar Chart
 * Visualizes different aspects of insurance coverage quality
 */
export default function CoverageScoreChart({
  scores,
  title = 'Coverage Analysis',
  height = 400,
}: CoverageScoreChartProps) {
  const data = [
    { category: 'Affordability', score: scores.affordability, fullMark: 100 },
    { category: 'Network Coverage', score: scores.networkCoverage, fullMark: 100 },
    { category: 'Benefits', score: scores.benefitComprehensiveness, fullMark: 100 },
    { category: 'Prescriptions', score: scores.prescriptionCoverage, fullMark: 100 },
    { category: 'Out-of-Pocket', score: scores.outOfPocketProtection, fullMark: 100 },
  ];

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        category: string;
        score: number;
        fullMark: number;
      };
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.category}</p>
          <p className="text-primary font-medium">{data.score}/100</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
          />
          <Radar
            name="Coverage Score"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Score Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {data.map((item) => (
          <div key={item.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-700">{item.category}:</span>
            <span className={`font-semibold ${
              item.score >= 80 ? 'text-green-600' :
              item.score >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {item.score}/100
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
