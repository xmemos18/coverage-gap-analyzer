/**
 * FAQ feedback hook
 * Tracks which FAQ answers users find helpful (client-side only, no backend)
 */

import { useState, useCallback, useEffect } from 'react';

interface FAQFeedback {
  [key: number]: 'helpful' | 'not-helpful';
}

const STORAGE_KEY = 'faq_feedback';

export function useFAQFeedback() {
  const [feedback, setFeedback] = useState<FAQFeedback>({});

  // Load feedback from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFeedback(JSON.parse(stored));
      }
    } catch (error) {
      // Ignore errors - feedback is not critical
    }
  }, []);

  // Save feedback to localStorage
  const saveFeedback = useCallback((index: number, isHelpful: boolean) => {
    const newFeedback: FAQFeedback = {
      ...feedback,
      [index]: isHelpful ? ('helpful' as const) : ('not-helpful' as const),
    };
    setFeedback(newFeedback);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFeedback));
    } catch (error) {
      // Ignore storage errors
    }
  }, [feedback]);

  const getFeedback = useCallback((index: number) => {
    return feedback[index];
  }, [feedback]);

  return { saveFeedback, getFeedback };
}
