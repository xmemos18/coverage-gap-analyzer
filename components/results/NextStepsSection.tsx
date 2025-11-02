import { memo } from 'react';

interface NextStepsSectionProps {
  actionItems: string[];
}

interface ParsedStep {
  title: string;
  emoji?: string;
  substeps: string[];
}

function NextStepsSection({ actionItems }: NextStepsSectionProps) {
  // Parse the action items into structured steps
  const parseActionItems = (): ParsedStep[] => {
    const steps: ParsedStep[] = [];

    actionItems.forEach(item => {
      if (!item || item.trim().length === 0) return;

      // Check if this contains **Step N:** pattern
      const stepMatch = item.match(/\*\*Step\s+(\d+):\s*([^*]+)\*\*/i);

      if (stepMatch) {
        // This is a main step with substeps
        const fullText = item;

        // Extract emoji at the start if present
        const emojiMatch = fullText.match(/^([🔍💊🏥📋📍💰⚠️✅🎯🔥⏰📞💡])\s*/);
        const emoji = emojiMatch ? emojiMatch[1] : undefined;

        // Extract title (everything between **Step N: and **)
        const titleMatch = fullText.match(/\*\*Step\s+\d+:\s*([^*]+)\*\*/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Split by arrows to get substeps
        const arrowParts = fullText.split('→');

        // Skip the first part (contains the title) and process the rest
        const substeps = arrowParts
          .slice(1)
          .map(part => part.trim())
          .filter(part => part.length > 0)
          .map(part => {
            // Clean up the text: remove extra asterisks, clean whitespace
            return part
              .replace(/\*\*/g, '') // Remove remaining asterisks
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
          });

        steps.push({ title, emoji, substeps });
      } else {
        // This is a simple item (no step pattern)
        // Extract emoji if present
        const emojiMatch = item.match(/^([🔍💊🏥📋📍💰⚠️✅🎯🔥⏰📞💡])\s*/);
        const emoji = emojiMatch ? emojiMatch[1] : undefined;

        // Get the title (remove emoji)
        const title = item.replace(/^[🔍💊🏥📋📍💰⚠️✅🎯🔥⏰📞💡]\s*/, '').trim();

        steps.push({ title, emoji, substeps: [] });
      }
    });

    return steps;
  };

  const parsedSteps = parseActionItems();

  // Helper function to parse inline bold text
  const parseFormattedText = (text: string) => {
    const parts: Array<{ text: string; bold: boolean }> = [];
    let currentIndex = 0;

    // Find all **text** patterns
    const boldPattern = /\*\*([^*]+)\*\*/g;
    let match;

    while ((match = boldPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push({ text: text.slice(currentIndex, match.index), bold: false });
      }
      // Add the bold text
      parts.push({ text: match[1], bold: true });
      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push({ text: text.slice(currentIndex), bold: false });
    }

    return parts.length > 0 ? parts : [{ text, bold: false }];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 print:shadow-none print:border-2">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <span className="text-3xl">✅</span>
        Your Next Steps
      </h3>

      <div className="space-y-6">
        {parsedSteps.map((step, index) => (
          <div
            key={index}
            className="print:break-inside-avoid bg-gradient-to-r from-blue-50/50 to-white rounded-lg p-5 border border-blue-100 hover:border-blue-200 transition-colors"
          >
            {/* Step header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  {step.emoji && (
                    <span className="text-2xl flex-shrink-0">{step.emoji}</span>
                  )}
                  <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                    {step.title}
                  </h4>
                </div>
              </div>
            </div>

            {/* Substeps */}
            {step.substeps.length > 0 && (
              <div className="ml-16 space-y-3">
                {step.substeps.map((substep, substepIndex) => {
                  const formattedParts = parseFormattedText(substep);
                  return (
                    <div key={substepIndex} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0 mt-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-colors"></div>
                      </div>
                      <p className="text-gray-700 leading-relaxed flex-1">
                        {formattedParts.map((part, partIndex) => (
                          part.bold ? (
                            <strong key={partIndex} className="font-semibold text-gray-900">
                              {part.text}
                            </strong>
                          ) : (
                            <span key={partIndex}>{part.text}</span>
                          )
                        ))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Helpful tip at the bottom */}
      <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong className="text-blue-900">💡 Pro Tip:</strong> Complete these steps in order for the smoothest experience.
          Most people can complete steps 1-3 in under 2 hours.
        </p>
      </div>
    </div>
  );
}

export default memo(NextStepsSection);
