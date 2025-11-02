/**
 * Error message component
 * Displays validation errors with icon and styling
 */

interface ErrorMessageProps {
  message?: string;
  error?: string; // Alias for message (for consistency)
  id?: string;
  className?: string;
}

export default function ErrorMessage({ message, error, id, className = '' }: ErrorMessageProps) {
  const errorText = message || error;

  if (!errorText) return null;

  return (
    <div
      id={id}
      className={`flex items-start gap-2 mt-1 text-sm text-red-600 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{errorText}</span>
    </div>
  );
}
