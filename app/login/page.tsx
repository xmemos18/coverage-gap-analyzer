'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NDAModal from '@/components/NDAModal';
import { useAuthentication } from '@/hooks/useAuthentication';

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    password,
    showPassword,
    error,
    showNDA,
    ndaAccepted,
    isLockedOut,
    lockoutTimeRemaining,
    setPassword,
    handleTogglePassword,
    handleNDAAccept,
    handleNDADecline,
    handleSubmit
  } = useAuthentication();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-premium dark:shadow-glow-blue p-8 border border-gray-200 dark:border-dark-700">
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: 0.1,
                }}
              >
                <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Coverage Gap Analyzer
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Confidential Access Portal
                </p>
              </motion.div>
            </div>

            {/* Lockout Warning */}
            <AnimatePresence>
              {isLockedOut && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
                >
                  <p className="text-sm text-red-800 dark:text-red-300 text-center font-semibold">
                    Too many failed attempts. Please wait {lockoutTimeRemaining} seconds.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Access Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    disabled={isLockedOut}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter password"
                    required
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={handleTogglePassword}
                    disabled={isLockedOut}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      id="password-error"
                      className="mt-2 text-sm text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: isLockedOut ? 1 : 1.02 }}
                whileTap={{ scale: isLockedOut ? 1 : 0.98 }}
                disabled={isLockedOut}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLockedOut ? `Locked (${lockoutTimeRemaining}s)` : 'Access System'}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Protected by NDA • Confidential Information
              </p>
              {ndaAccepted && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-green-600 dark:text-green-400 mt-2"
                >
                  ✓ NDA Accepted
                </motion.p>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
          >
            <p>
              This system contains confidential and proprietary information.
            </p>
            <p className="mt-1">
              Unauthorized access is strictly prohibited.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* NDA Modal */}
      <NDAModal
        isOpen={showNDA}
        onAccept={handleNDAAccept}
        onDecline={handleNDADecline}
      />
    </>
  );
}
