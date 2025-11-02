interface ErrorMessageProps {
  message: string;
  id?: string;
}

/**
 * Error message component with icon and color
 * Provides visual indicator beyond just color for accessibility
 */
export default function ErrorMessage({ message, id }: ErrorMessageProps) {
  return (
    <p
      id={id}
      className="text-red-600 text-sm mt-2 flex items-center gap-1"
      role="alert"
      aria-live="polite"
    >
      <span aria-hidden="true" className="font-bold">⚠</span>
      <span>{message}</span>
    </p>
  );
}
