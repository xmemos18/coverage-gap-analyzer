import { useEffect, RefObject } from 'react';

/**
 * Custom hook for keyboard navigation
 * Enables arrow key navigation between focusable elements
 */
export function useKeyboardNavigation(
  containerRef: RefObject<HTMLElement>,
  options: {
    enabled?: boolean;
    onEnter?: () => void;
    onEscape?: () => void;
  } = {}
) {
  const { enabled = true, onEnter, onEscape } = options;

  useEffect(() => {
    // Capture container ref early and check for null
    const container = containerRef.current;
    if (!enabled || !container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Container is guaranteed non-null at this point due to early return above

      // Get all focusable elements within the container
      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const focusableArray = Array.from(focusableElements);
      const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < focusableArray.length - 1) {
            focusableArray[currentIndex + 1]?.focus();
          } else {
            focusableArray[0]?.focus();
          }
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) {
            focusableArray[currentIndex - 1]?.focus();
          } else {
            focusableArray[focusableArray.length - 1]?.focus();
          }
          break;

        case 'Home':
          e.preventDefault();
          focusableArray[0]?.focus();
          break;

        case 'End':
          e.preventDefault();
          focusableArray[focusableArray.length - 1]?.focus();
          break;

        case 'Enter':
          if (onEnter) {
            e.preventDefault();
            onEnter();
          }
          break;

        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;
      }
    };

    // Container was captured and validated at the top of useEffect
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, containerRef, onEnter, onEscape]);
}

/**
 * Custom hook for skip link functionality
 * Allows users to skip repetitive navigation
 */
export function useSkipLink(targetId: string) {
  const skipToContent = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return skipToContent;
}

/**
 * Custom hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, (e: KeyboardEvent) => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Create a key combination string (e.g., "ctrl+s", "alt+n")
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');
      if (e.metaKey) keys.push('meta');
      keys.push(e.key.toLowerCase());

      const combo = keys.join('+');

      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo](e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

/**
 * Custom hook for focus trap
 * Keeps focus within a modal or dialog
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}
