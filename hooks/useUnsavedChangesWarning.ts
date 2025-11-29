/**
 * Hook to warn users about unsaved changes before leaving the page
 *
 * Implements the beforeunload event to show a browser-native confirmation dialog
 * when users attempt to navigate away or close the tab with unsaved data.
 */

import { useEffect } from 'react';

interface UseUnsavedChangesWarningOptions {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Optional custom message (note: most browsers ignore custom messages) */
  message?: string;
}

/**
 * Hook to display an unsaved changes warning
 *
 * @example
 * ```tsx
 * const hasChanges = formData !== initialData;
 * useUnsavedChangesWarning({ hasUnsavedChanges: hasChanges });
 * ```
 */
export function useUnsavedChangesWarning({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesWarningOptions): void {
  // Handle browser navigation (back/forward, tab close, external navigation)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;

      // Standard way to trigger the browser's confirmation dialog
      event.preventDefault();
      // Chrome requires returnValue to be set
      event.returnValue = message;
      return message;
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}

/**
 * Check if form data has been modified from initial state
 *
 * @param currentData Current form data
 * @param initialData Initial form data
 * @param ignoredFields Fields to ignore when comparing
 */
export function hasFormChanges<T extends Record<string, unknown>>(
  currentData: T,
  initialData: T,
  ignoredFields: (keyof T)[] = []
): boolean {
  const keysToCheck = Object.keys(currentData).filter(
    key => !ignoredFields.includes(key as keyof T)
  );

  return keysToCheck.some(key => {
    const current = currentData[key];
    const initial = initialData[key];

    // Handle nested objects
    if (typeof current === 'object' && current !== null && typeof initial === 'object' && initial !== null) {
      return JSON.stringify(current) !== JSON.stringify(initial);
    }

    return current !== initial;
  });
}
