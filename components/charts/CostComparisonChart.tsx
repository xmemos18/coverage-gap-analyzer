'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CostRange } from '@/types';

interface CostComparisonChartProps {
  data: Array<{
    name: string;
    cost: number | CostRange;
    color?: string;
  }>;
  title?: string;
  height?: number;
}

/**
 * Cost Comparison Bar Chart
 * Visualizes monthly costs across different insurance options
 */
export default function CostComparisonChart({
  data,
  title = 'Monthly Cost Comparison',
  height = 300,
}: CostComparisonChartProps) {
  // Transform data to handle CostRange objects
  const chartData = data.map((item) => ({
    name: item.name,
    low: typeof item.cost === 'object' ? item.cost.low : item.cost,
    high: typeof item.cost === 'object' ? item.cost.high : item.cost,
    average:
      typeof item.cost === 'object'
        ? (item.cost.low + item.cost.high) / 2
        : item.cost,
    color: item.color || '#3b82f6',
  }));

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        low: number;
        high: number;
        average: number;
      };
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          {data.low === data.high ? (
            <p className="text-primary font-medium">{formatCurrency(data.low)}/month</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Range: {formatCurrency(data.low)} - {formatCurrency(data.high)}
              </p>
              <p className="text-primary font-medium">
                Average: {formatCurrency(data.average)}/month
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar
            dataKey="average"
            name="Monthly Cost"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
