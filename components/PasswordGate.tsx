'use client';

import { useState, useEffect } from 'react';
import NDAModal from './NDAModal';

const CORRECT_PASSWORD = '1234abcd';
const AUTH_KEY = 'site-authenticated';
const NDA_KEY = 'nda-accepted';

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNDA, setShowNDA] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = sessionStorage.getItem(AUTH_KEY);
    const ndaStatus = sessionStorage.getItem(NDA_KEY);

    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }

    if (ndaStatus === 'true') {
      setNdaAccepted(true);
    }

    setIsLoading(false);
  }, []);

  const handleTogglePassword = () => {
    if (!ndaAccepted) {
      setShowNDA(true);
    } else {
      setShowPassword(!showPassword);
    }
  };

  const handleNDAAccept = () => {
    setNdaAccepted(true);
    sessionStorage.setItem(NDA_KEY, 'true');
    setShowNDA(false);
    setShowPassword(true);
  };

  const handleNDADecline = () => {
    setShowNDA(false);
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ndaAccepted) {
      setShowNDA(true);
      return;
    }

    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  // Show loading state briefly to check auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-dark-900 dark:to-dark-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <NDAModal
          isOpen={showNDA}
          onAccept={handleNDAAccept}
          onDecline={handleNDADecline}
        />

        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-dark-900 dark:to-dark-800 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-dark-700">
              {/* Lock Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-blue-600 bg-opacity-10 dark:bg-blue-500 dark:bg-opacity-20 p-4 rounded-full">
                  <svg
                    className="w-12 h-12 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
                Password Required
              </h1>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                Please enter the password to access this site
              </p>

              {/* Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 dark:bg-dark-700 dark:border-dark-600 dark:text-gray-100 text-lg ${
                        error ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                      }`}
                      placeholder="Enter password"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={handleTogglePassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg text-lg"
                >
                  Enter
                </button>
              </form>

              {/* NDA Notice */}
              {!ndaAccepted && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300 text-center">
                    You must read and accept the NDA before accessing this site. Click the eye icon or Enter to view the agreement.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Key Insurance Matters
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show content if authenticated
  return <>{children}</>;
}
