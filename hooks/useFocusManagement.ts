import { useEffect, useRef } from 'react';

/**
 * Auto-focus the first input field when component mounts
 */
export function useAutoFocus(enabled = true) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enabled && ref.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        ref.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [enabled]);

  return ref;
}

/**
 * Restore focus to a specific element after an action
 */
export function useFocusReturn(shouldReturn: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (shouldReturn) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      return () => {
        // Restore focus when unmounting or condition changes
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
    return undefined;
  }, [shouldReturn]);

  return previousFocusRef;
}

/**
 * Focus on first error field in a form
 */
export function useFocusOnError(errors: Record<string, string | undefined>) {
  useEffect(() => {
    const errorKeys = Object.keys(errors).filter(key => errors[key]);

    if (errorKeys.length > 0) {
      // Find the first field with an error
      const firstErrorField = document.querySelector<HTMLElement>(
        `[name="${errorKeys[0]}"], [data-error-field="${errorKeys[0]}"], #${errorKeys[0]}`
      );

      if (firstErrorField) {
        // Focus the field
        firstErrorField.focus();

        // Scroll into view
        firstErrorField.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [errors]);
}

/**
 * Manage focus when transitioning between steps
 */
export function useStepFocus(currentStep: number) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll window to top first for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (containerRef.current) {
      // Find the first focusable element in the step
      const firstFocusable = containerRef.current.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        // If no focusable element, focus the container itself
        containerRef.current.focus();
      }
    }
  }, [currentStep]);

  return containerRef;
}

/**
 * Announce changes to screen readers
 */
export function useLiveRegionAnnouncement() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return { liveRegionRef, announce };
}

/**
 * Focus visible indicator - only show focus outlines for keyboard navigation
 */
export function useFocusVisible() {
  useEffect(() => {
    const handleMouseDown = () => {
      document.body.classList.add('mouse-user');
      document.body.classList.remove('keyboard-user');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
        document.body.classList.remove('mouse-user');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
