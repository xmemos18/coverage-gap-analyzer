/**
 * Full-screen loading overlay
 * Used for blocking operations like form submission
 */

import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
}

export default function LoadingOverlay({
  isVisible,
  title = 'Loading...',
  message,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby={message ? 'loading-message' : undefined}
    >
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <LoadingSpinner size="xl" label={title} />
        </div>
        <h3 id="loading-title" className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        {message && (
          <p id="loading-message" className="text-gray-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
