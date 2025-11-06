/**
 * Keyboard Shortcuts Help Component
 * Displays available keyboard shortcuts to improve accessibility
 */

'use client';

import { useState } from 'react';

interface Shortcut {
  keys: string;
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: 'Alt + N', description: 'Next step' },
  { keys: 'Alt + B', description: 'Previous step' },
  { keys: 'Alt + S', description: 'Save progress' },
  { keys: 'Alt + C', description: 'Clear form' },
  { keys: '?', description: 'Show this help' },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors print:hidden"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (Press ?)"
      >
        <span className="text-lg font-bold">?</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 print:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="shortcuts-title"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="shortcuts-title" className="text-2xl font-bold text-gray-900">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {SHORTCUTS.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0"
                >
                  <span className="text-gray-700">{shortcut.description}</span>
                  <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Tip:</strong> Use these shortcuts to navigate the calculator more quickly.
                All shortcuts work on the calculator page.
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
