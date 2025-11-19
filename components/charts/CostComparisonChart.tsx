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
 * Premium Cost Comparison Bar Chart
 * Visualizes monthly costs across different insurance options with premium styling
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
        color: string;
      };
    }>;
  }

  // Premium Custom Tooltip
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="relative overflow-hidden bg-white rounded-xl shadow-2xl border-2 border-gray-200">
          {/* Top accent bar with plan color */}
          <div
            className="h-2"
            style={{
              background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`
            }}
          ></div>

          <div className="p-4">
            {/* Plan name with icon */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm shadow-md rotate-3"
                style={{ background: data.color }}
              >
                💰
              </div>
              <p className="font-bold text-gray-900">{data.name}</p>
            </div>

            {/* Cost details */}
            {data.low === data.high ? (
              <div className="space-y-1">
                <p className="text-xs text-gray-600 font-medium">Monthly Premium</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {formatCurrency(data.low)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-2">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Cost Range</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {formatCurrency(data.low)} - {formatCurrency(data.high)}
                  </p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-2">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Average</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(data.average)}/mo
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl shadow-sm rotate-2">
            📊
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h3>
        </div>
      )}

      {/* Premium Chart Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-6 shadow-md">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}
        ></div>

        <div className="relative">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                {/* Define gradients for bars if needed */}
                {chartData.map((entry, index) => (
                  <linearGradient
                    key={`gradient-${index}`}
                    id={`barGradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" strokeOpacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                tickLine={{ stroke: '#cbd5e1' }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                tickLine={{ stroke: '#cbd5e1' }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)', radius: 8 }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '24px', fontWeight: 600 }}
                iconType="circle"
              />
              <Bar
                dataKey="average"
                name="Monthly Cost"
                radius={[12, 12, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#barGradient-${index})`}
                    stroke={entry.color}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
