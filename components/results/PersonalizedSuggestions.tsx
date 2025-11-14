'use client';

import { useState } from 'react';
import { getPriorityColors, getPriorityBadge, getSuggestionIcon } from '@/lib/results-utils';
import { Suggestion } from '@/types';

interface PersonalizedSuggestionsProps {
  suggestions: Suggestion[];
}

export default function PersonalizedSuggestions({ suggestions }: PersonalizedSuggestionsProps) {
  const [expandedMedium, setExpandedMedium] = useState(true);
  const [expandedLow, setExpandedLow] = useState(false);

  // If no suggestions, show beautiful "all set" state
  if (suggestions.length === 0) {
    return (
      <section className="mb-12 md:mb-16 animate-fadeIn">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 px-6 py-16 md:px-12 md:py-20 shadow-xl">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(255, 255, 255) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>

          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-6xl shadow-xl">
                ✓
              </div>
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">
              You&apos;re All Set!
            </h3>
            <p className="text-lg md:text-xl text-green-50 max-w-2xl mx-auto leading-relaxed">
              Your coverage plan is well-optimized. We&apos;ll let you know if we identify any opportunities for improvement.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Group suggestions by priority
  const highPriority = suggestions.filter(s => s.priority === 'high');
  const mediumPriority = suggestions.filter(s => s.priority === 'medium');
  const lowPriority = suggestions.filter(s => s.priority === 'low');

  // Calculate total potential savings
  const totalSavings = suggestions.reduce((sum, s) => sum + (s.potentialSavings || 0), 0);

  return (
    <section className="mb-12 md:mb-16 animate-fadeIn">
      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 px-6 py-12 md:px-12 md:py-16">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(255, 255, 255) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10">
          {/* Section Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-4xl shadow-xl rotate-3 hover:rotate-6 transition-transform duration-300 cursor-pointer">
              💡
            </div>
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Personalized Suggestions
              </h3>
              <p className="text-green-100 text-sm md:text-base">
                Tailored recommendations to optimize your coverage
              </p>
            </div>

            {/* Total Count Badge */}
            <div className="hidden md:flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/30">
              <div className="text-xs font-semibold text-green-100 uppercase tracking-wide mb-1">
                Total Suggestions
              </div>
              <div className="text-3xl font-bold text-white">
                {suggestions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Curved Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-b-3xl bg-white px-6 py-8 md:px-12 md:py-12 shadow-xl">

        {/* Summary Statistics Bar */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* High Priority Count */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-3xl shadow-md rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  ⚠️
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    High Priority
                  </div>
                  <div className="text-3xl font-bold text-red-600">
                    {highPriority.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Suggestions */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-3xl shadow-md rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  💡
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Total Items
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {suggestions.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Potential Savings */}
            {totalSavings > 0 ? (
              <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl shadow-md rotate-3 group-hover:rotate-6 transition-transform duration-300">
                    💰
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Potential Savings
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      ${Math.round(totalSavings)}
                      <span className="text-sm font-normal text-gray-600">/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="group relative overflow-hidden rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-3xl shadow-md rotate-3 group-hover:rotate-6 transition-transform duration-300">
                    🎯
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Focus Area
                    </div>
                    <div className="text-lg font-bold text-purple-900">
                      Coverage Quality
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Wins Callout (if significant savings) */}
        {totalSavings >= 50 && (
          <div className="mb-12 rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 p-8 md:p-10 shadow-xl border-2 border-amber-200">
            <div className="flex items-start gap-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-2xl mb-3">Quick Wins Available</h4>
                <p className="text-lg text-gray-800 leading-relaxed mb-4">
                  By implementing these suggestions, you could save up to <span className="font-bold text-amber-600">${Math.round(totalSavings)}/month</span>. That&apos;s <span className="font-bold text-green-600">${Math.round(totalSavings * 12)}/year</span> in your pocket!
                </p>
                <div className="text-sm font-medium text-gray-700">
                  Start with the high-priority items below for the biggest impact.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* High Priority Suggestions */}
        {highPriority.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full"></div>
              <h4 className="text-2xl md:text-3xl font-bold text-gray-900">High Priority</h4>
              <div className="flex items-center gap-2 bg-red-100 border-2 border-red-300 rounded-full px-4 py-1.5 shadow-sm">
                <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-red-900">
                  {highPriority.length} {highPriority.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {highPriority.map((suggestion, index) => (
                <SuggestionCard key={index} suggestion={suggestion} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority Suggestions */}
        {mediumPriority.length > 0 && (
          <div className="mb-12">
            <button
              onClick={() => setExpandedMedium(!expandedMedium)}
              className="w-full flex items-center justify-between gap-3 mb-8 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="h-1 w-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full"></div>
                <h4 className="text-2xl md:text-3xl font-bold text-gray-900">Medium Priority</h4>
                <div className="flex items-center gap-2 bg-yellow-100 border-2 border-yellow-300 rounded-full px-4 py-1.5 shadow-sm">
                  <span className="text-xs font-bold text-yellow-900">
                    {mediumPriority.length} {mediumPriority.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
              </div>
              <svg
                className={`h-6 w-6 text-gray-600 transition-transform duration-300 ${expandedMedium ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedMedium && (
              <div className="space-y-6 animate-fadeIn">
                {mediumPriority.map((suggestion, index) => (
                  <SuggestionCard key={index} suggestion={suggestion} index={index} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Low Priority Suggestions */}
        {lowPriority.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setExpandedLow(!expandedLow)}
              className="w-full flex items-center justify-between gap-3 mb-8 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                <h4 className="text-2xl md:text-3xl font-bold text-gray-900">Low Priority</h4>
                <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-300 rounded-full px-4 py-1.5 shadow-sm">
                  <span className="text-xs font-bold text-blue-900">
                    {lowPriority.length} {lowPriority.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
              </div>
              <svg
                className={`h-6 w-6 text-gray-600 transition-transform duration-300 ${expandedLow ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedLow && (
              <div className="space-y-6 animate-fadeIn">
                {lowPriority.map((suggestion, index) => (
                  <SuggestionCard key={index} suggestion={suggestion} index={index} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Individual Suggestion Card Component
function SuggestionCard({ suggestion, index }: { suggestion: Suggestion; index: number }) {
  const priorityStyles = {
    high: {
      border: 'border-red-400 border-l-4',
      bg: 'bg-gradient-to-br from-red-50 to-orange-50',
      icon: 'from-red-500 to-orange-600',
      shadow: 'shadow-red-100',
      pattern: 'rgb(239, 68, 68)'
    },
    medium: {
      border: 'border-yellow-400 border-l-4',
      bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      icon: 'from-yellow-500 to-amber-600',
      shadow: 'shadow-yellow-100',
      pattern: 'rgb(234, 179, 8)'
    },
    low: {
      border: 'border-blue-400 border-l-4',
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      icon: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-100',
      pattern: 'rgb(59, 130, 246)'
    }
  };

  const style = priorityStyles[suggestion.priority];
  const badge = getPriorityBadge(suggestion.priority);
  const icon = getSuggestionIcon(suggestion.type);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border-2 ${style.border} ${style.bg} p-6 md:p-8 ${style.shadow} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, ${style.pattern} 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }}></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Icon */}
            <div className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-gradient-to-br ${style.icon} text-2xl md:text-3xl shadow-md rotate-3 group-hover:rotate-6 transition-transform duration-300 flex-shrink-0`}>
              {icon}
            </div>

            {/* Title */}
            <div className="flex-1">
              <h5 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {suggestion.title}
              </h5>
            </div>
          </div>

          {/* Priority Badge */}
          <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-bold uppercase tracking-wider ${badge.class} shadow-md flex items-center gap-1.5 flex-shrink-0`}>
            {suggestion.priority === 'high' && (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {suggestion.priority}
          </div>
        </div>

        {/* Description */}
        <p className="text-base md:text-lg leading-relaxed text-gray-700 mb-4">
          {suggestion.description}
        </p>

        {/* Savings Callout */}
        {suggestion.potentialSavings && suggestion.potentialSavings > 0 && (
          <div className="mt-6 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-green-200 p-4 md:p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-xl shadow-sm">
                  💰
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-0.5">
                    Potential Savings
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-green-600">
                    ${Math.round(suggestion.potentialSavings)}
                    <span className="text-sm font-normal text-gray-600">/month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Annual Savings */}
            <div className="flex items-center justify-between pt-3 border-t border-green-200">
              <span className="text-sm font-medium text-gray-700">Annual Impact:</span>
              <span className="text-lg font-bold text-green-700">
                ${Math.round(suggestion.potentialSavings * 12).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
