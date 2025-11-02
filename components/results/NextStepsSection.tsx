import { memo, useMemo } from 'react';

interface NextStepsSectionProps {
  actionItems: string[];
}

interface ParsedStep {
  title: string;
  emoji?: string;
  substeps: string[];
}

// More flexible emoji regex that matches any emoji character
const EMOJI_REGEX = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])\s*/u;

function NextStepsSection({ actionItems }: NextStepsSectionProps) {
  // Parse the action items into structured steps with error handling
  const parsedSteps = useMemo(() => {
    try {
      const steps: ParsedStep[] = [];

      // CRITICAL FIX: Split multi-line strings first
      // formatActionStep returns strings with \n that need to be split
      const expandedItems = actionItems.flatMap(item =>
        item.split('\n').filter(line => line.trim().length > 0)
      );

      let currentStep: ParsedStep | null = null;

      expandedItems.forEach(item => {
        if (!item || item.trim().length === 0) return;

        const trimmedItem = item.trim();

        // Check if this contains **Step N:** pattern
        const stepMatch = trimmedItem.match(/\*\*Step\s+(\d+):\s*(.+?)\*\*/i);

        if (stepMatch) {
          // Save previous step if exists
          if (currentStep) {
            steps.push(currentStep);
          }

          // Start a new step
          const fullText = trimmedItem;

          // Extract emoji at the start if present (using flexible regex)
          const emojiMatch = fullText.match(EMOJI_REGEX);
          const emoji = emojiMatch ? emojiMatch[1] : undefined;

          // Extract title (everything between **Step N: and **)
          const title = stepMatch[2].trim();

          currentStep = { title, emoji, substeps: [] };
        } else if (trimmedItem.startsWith('→') || trimmedItem.startsWith('-') || trimmedItem.startsWith('•')) {
          // This is a substep
          if (currentStep) {
            const cleanedSubstep = trimmedItem
              .replace(/^[→\-•]\s*/, '') // Remove arrow/bullet
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();

            if (cleanedSubstep) {
              currentStep.substeps.push(cleanedSubstep);
            }
          }
        } else {
          // This is a simple item without step pattern or a header
          // Save previous step if exists
          if (currentStep) {
            steps.push(currentStep);
            currentStep = null;
          }

          // Check if it's a header-style item (starts with emoji or is short)
          const emojiMatch = trimmedItem.match(EMOJI_REGEX);
          const emoji = emojiMatch ? emojiMatch[1] : undefined;
          const title = trimmedItem.replace(EMOJI_REGEX, '').trim();

          if (title) {
            steps.push({ title, emoji, substeps: [] });
          }
        }
      });

      // Don't forget the last step
      if (currentStep) {
        steps.push(currentStep);
      }

      return steps;
    } catch (error) {
      console.error('Error parsing action items:', error);
      // Return empty array on error to prevent component crash
      return [];
    }
  }, [actionItems]);

  // Helper function to parse inline bold text with improved regex
  const parseFormattedText = (text: string) => {
    const parts: Array<{ text: string; bold: boolean }> = [];
    let currentIndex = 0;

    // Improved regex that handles edge cases better
    const boldPattern = /\*\*(.+?)\*\*/g;
    let match;

    while ((match = boldPattern.exec(text)) !== null) {
      // Skip empty bold patterns
      if (!match[1] || match[1].trim().length === 0) continue;

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

  // Empty state handling
  if (!actionItems || actionItems.length === 0 || parsedSteps.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 print:shadow-none print:border-2"
      aria-labelledby="next-steps-heading"
    >
      <h3
        id="next-steps-heading"
        className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3"
      >
        <span className="text-3xl" aria-hidden="true">✅</span>
        Your Next Steps
      </h3>

      <ol className="space-y-6" role="list" aria-label="Action steps to take">
        {parsedSteps.map((step, index) => (
          <li
            key={index}
            role="listitem"
            className="print:break-inside-avoid bg-gradient-to-r from-blue-50/50 to-white rounded-lg p-5 border border-blue-100 hover:border-blue-200 transition-colors"
          >
            {/* Step header */}
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div
                className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg md:text-xl shadow-md"
                aria-label={`Step ${index + 1}`}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  {step.emoji && (
                    <span className="text-xl md:text-2xl flex-shrink-0" aria-hidden="true">
                      {step.emoji}
                    </span>
                  )}
                  <h4 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                    {step.title}
                  </h4>
                </div>
              </div>
            </div>

            {/* Substeps */}
            {step.substeps.length > 0 && (
              <ul
                className="ml-12 md:ml-16 space-y-3"
                role="list"
                aria-label={`Sub-steps for ${step.title}`}
              >
                {step.substeps.map((substep, substepIndex) => {
                  const formattedParts = parseFormattedText(substep);
                  return (
                    <li key={substepIndex} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0 mt-1.5">
                        <div
                          className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-colors"
                          aria-hidden="true"
                        ></div>
                      </div>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed flex-1">
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
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {/* Helpful tip at the bottom */}
      <div
        className="mt-8 p-4 md:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500"
        role="note"
        aria-label="Helpful tip"
      >
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong className="text-blue-900">💡 Pro Tip:</strong> Complete these steps in order for the smoothest experience.
          Most people can complete steps 1-3 in under 2 hours.
        </p>
      </div>
    </section>
  );
}

export default memo(NextStepsSection);
