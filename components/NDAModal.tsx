'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NDAModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function NDAModal({ isOpen, onAccept, onDecline }: NDAModalProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (scrolledToBottom) {
      setHasScrolled(true);
    }
  };

  const handleAccept = () => {
    if (agreedToTerms) {
      onAccept();
      // Reset state for next time
      setHasScrolled(false);
      setAgreedToTerms(false);
    }
  };

  const handleDecline = () => {
    onDecline();
    setHasScrolled(false);
    setAgreedToTerms(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleDecline}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-dark-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-8 pt-8 pb-4 border-b border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Non-Disclosure Agreement
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Please read and accept the terms below to continue
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div
                className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
                onScroll={handleScroll}
              >
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 my-6">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                      ⚠️ IMPORTANT: This system contains confidential and proprietary information.
                      By accessing this system, you agree to the following terms.
                    </p>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                    1. Confidential Information
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    You acknowledge that the Coverage Gap Analyzer system, including but not limited to its
                    algorithms, data structures, insurance plan information, pricing models, recommendation
                    engine, source code, design documents, and business processes (collectively, &ldquo;Confidential
                    Information&rdquo;) are the exclusive property of the Company and contain valuable trade secrets
                    and proprietary information.
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                    2. Non-Disclosure Obligations
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    You agree to:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                    <li>Keep all Confidential Information strictly confidential</li>
                    <li>Not disclose, publish, or disseminate any Confidential Information to any third party</li>
                    <li>Not use Confidential Information for any purpose other than authorized evaluation</li>
                    <li>Not copy, reproduce, reverse engineer, or create derivative works from the system</li>
                    <li>Not take screenshots, recordings, or any other form of capture of the system</li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                    3. Access Restrictions
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Access to this system is granted solely for authorized purposes. You agree not to:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4 mt-2">
                    <li>Share your access credentials with any other person</li>
                    <li>Attempt to gain unauthorized access to any system components</li>
                    <li>Interfere with or disrupt the system&apos;s operation</li>
                    <li>Extract, download, or export data in bulk</li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                    4. Data Protection
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    The system may contain personal health information (PHI) and other sensitive data subject
                    to privacy regulations including HIPAA. You agree to handle all such information in
                    accordance with applicable laws and regulations.
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                    5. Term and Termination
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Your obligations under this NDA shall continue indefinitely until the Confidential
                    Information becomes publicly available through no fault of your own. Upon termination
                    of access, you must immediately cease all use of the system and destroy any copies of
                    Confidential Information in your possession.
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                    6. Remedies
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    You acknowledge that unauthorized disclosure or use of Confidential Information would
                    cause irreparable harm for which monetary damages would be inadequate. The Company
                    shall be entitled to seek injunctive relief, specific performance, and all other
                    remedies available at law or in equity.
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                    7. Governing Law
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    This Agreement shall be governed by and construed in accordance with the laws of the
                    United States, without regard to conflict of law principles.
                  </p>

                  <div className="bg-gray-100 dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded-lg p-4 mt-8">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                      By clicking &ldquo;I Accept&rdquo; below, you acknowledge that you have read, understood, and
                      agree to be bound by all terms and conditions of this Non-Disclosure Agreement.
                    </p>
                  </div>
                </div>

                {!hasScrolled && (
                  <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-dark-800 via-white dark:via-dark-800 to-transparent pt-8 pb-2">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                      ↓ Please scroll to the bottom to continue
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 pb-8 pt-4 border-t border-gray-200 dark:border-dark-700 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    disabled={!hasScrolled}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span
                    className={`text-sm ${
                      hasScrolled
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    I have read and agree to the terms of this Non-Disclosure Agreement. I understand
                    that violation of these terms may result in legal action.
                  </span>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={!agreedToTerms}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-500"
                  >
                    I Accept
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
