/**
 * Field hint component
 * Displays helpful hints below form fields
 */

interface FieldHintProps {
  hint?: string;
  className?: string;
}

export default function FieldHint({ hint, className = '' }: FieldHintProps) {
  if (!hint) return null;

  return (
    <div
      className={`flex items-start gap-2 mt-1 text-sm text-gray-600 ${className}`}
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{hint}</span>
    </div>
  );
}
