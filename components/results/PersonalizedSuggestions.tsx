import { getPriorityColors, getPriorityBadge, getSuggestionIcon } from '@/lib/results-utils';
import { Suggestion } from '@/types';

interface PersonalizedSuggestionsProps {
  suggestions: Suggestion[];
}

export default function PersonalizedSuggestions({ suggestions }: PersonalizedSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-3xl" aria-hidden="true">💡</span>
        Personalized Suggestions
      </h3>
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const badge = getPriorityBadge(suggestion.priority);
          return (
            <div
              key={index}
              className={`rounded-lg p-6 border-2 ${getPriorityColors(suggestion.priority)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">{getSuggestionIcon(suggestion.type)}</span>
                  <h4 className="text-lg font-bold text-gray-900">{suggestion.title}</h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${badge.class}`}>
                  <span aria-hidden="true">{badge.icon}</span>
                  <span className="sr-only">{badge.text}</span>
                  <span aria-hidden="true">{suggestion.priority}</span>
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed mb-2">{suggestion.description}</p>
              {suggestion.potentialSavings && suggestion.potentialSavings > 0 && (
                <div className="mt-3 inline-block bg-success text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                  <span aria-hidden="true">💰</span>
                  Save ${Math.round(suggestion.potentialSavings)}/month
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
