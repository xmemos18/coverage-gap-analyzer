/**
 * Success indicator component
 * Shows green checkmark for valid fields
 */

interface SuccessIndicatorProps {
  show: boolean;
  message?: string;
  className?: string;
}

export default function SuccessIndicator({
  show,
  message = 'Valid',
  className = '',
}: SuccessIndicatorProps) {
  if (!show) return null;

  return (
    <div
      className={`flex items-center gap-2 mt-1 text-sm text-green-600 ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
