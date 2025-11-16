/**
 * Full-screen loading overlay
 * Used for blocking operations like form submission
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import PremiumLoadingSpinner from './animations/PremiumLoadingSpinner';

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
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loading-title"
          aria-describedby={message ? 'loading-message' : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl"
          >
            <div className="mb-6 flex justify-center">
              <PremiumLoadingSpinner size="lg" />
            </div>
            <h3 id="loading-title" className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
            {message && (
              <p id="loading-message" className="text-gray-600">
                {message}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
