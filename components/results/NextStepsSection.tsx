import { memo } from 'react';

interface NextStepsSectionProps {
  actionItems: string[];
}

function NextStepsSection({ actionItems }: NextStepsSectionProps) {
  // Filter out empty strings and process items for better display
  const processedItems = actionItems
    .filter(item => item && item.trim().length > 0)
    .map(item => {
      // Check if this is a header (has emoji at start or is all caps with colon)
      const isHeader = /^[🔍💊🏥📋📍💰⚠️✅🎯]/.test(item) || /^[A-Z\s]+:/.test(item);

      // Check if this is a sub-item (starts with arrow or dash)
      const isSubItem = item.startsWith('→') || item.startsWith('-') || item.startsWith('•');

      return {
        text: item,
        isHeader,
        isSubItem
      };
    });

  // Group items by headers
  const groupedItems: Array<{ header?: string; items: string[] }> = [];
  let currentGroup: { header?: string; items: string[] } = { items: [] };

  processedItems.forEach((item) => {
    if (item.isHeader) {
      // Start a new group
      if (currentGroup.header || currentGroup.items.length > 0) {
        groupedItems.push(currentGroup);
      }
      currentGroup = { header: item.text, items: [] };
    } else {
      currentGroup.items.push(item.text);
    }
  });

  // Don't forget the last group
  if (currentGroup.header || currentGroup.items.length > 0) {
    groupedItems.push(currentGroup);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8 print:shadow-none print:border-2">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-3xl">✅</span>
        Your Next Steps
      </h3>

      <div className="space-y-6">
        {groupedItems.map((group, groupIndex) => (
          <div key={groupIndex} className="print:break-inside-avoid">
            {/* Step number and header */}
            <div className="flex items-start gap-4 mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                {groupIndex + 1}
              </div>
              <div className="flex-1">
                {group.header && (
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {group.header}
                  </h4>
                )}

                {/* Action items for this step */}
                {group.items.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {group.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-gray-700">
                        <span className="text-accent mt-1 flex-shrink-0">•</span>
                        <span className="flex-1 leading-relaxed">
                          {item.replace(/^[→\-•]\s*/, '')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Separator between steps (except last) */}
            {groupIndex < groupedItems.length - 1 && (
              <div className="border-b border-gray-200 mt-4"></div>
            )}
          </div>
        ))}
      </div>

      {/* Helpful tip at the bottom */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
        <p className="text-sm text-gray-700">
          <strong className="text-blue-900">💡 Pro Tip:</strong> Complete these steps in order for the smoothest experience.
          Most people can complete steps 1-3 in under 2 hours.
        </p>
      </div>
    </div>
  );
}

export default memo(NextStepsSection);
