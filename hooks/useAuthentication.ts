/**
 * Shared Authentication Hook
 *
 * Uses server-side authentication with JWT tokens and httpOnly cookies.
 * All password validation happens server-side for security.
 */

import { useState, useEffect, useCallback } from 'react';

interface UseAuthenticationReturn {
  isAuthenticated: boolean;
  password: string;
  showPassword: boolean;
  error: string;
  isLoading: boolean;
  showNDA: boolean;
  ndaAccepted: boolean;
  isLockedOut: boolean;
  lockoutTimeRemaining: number;
  setPassword: (password: string) => void;
  handleTogglePassword: () => void;
  handleNDAAccept: () => void;
  handleNDADecline: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleLogout: () => void;
}

export function useAuthentication(): UseAuthenticationReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNDA, setShowNDA] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();

        setIsAuthenticated(data.authenticated);
        setNdaAccepted(data.ndaAccepted || false);
      } catch {
        // If status check fails, assume not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLockedOut || lockoutTimeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setLockoutTimeRemaining(prev => {
        if (prev <= 1) {
          setIsLockedOut(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimeRemaining]);

  // Server-side login
  const login = useCallback(async (passwordToValidate: string, nda: boolean): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: passwordToValidate,
          ndaAccepted: nda,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setNdaAccepted(true);
        setError('');
        setPassword('');
        return true;
      }

      // Handle error responses
      if (response.status === 429) {
        // Rate limited
        setIsLockedOut(true);
        setLockoutTimeRemaining(data.lockoutRemaining || 30);
        setError(`Too many failed attempts. Please wait ${data.lockoutRemaining || 30} seconds.`);
      } else if (response.status === 401) {
        // Invalid password
        if (data.isLockedOut) {
          setIsLockedOut(true);
          setLockoutTimeRemaining(data.lockoutRemaining || 30);
          setError(`Too many failed attempts. Please wait ${data.lockoutRemaining || 30} seconds.`);
        } else {
          const remaining = data.remainingAttempts ?? 0;
          setError(`Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        }
      } else if (response.status === 400) {
        setError(data.error || 'Invalid request');
      } else {
        setError('Authentication failed. Please try again.');
      }

      setPassword('');
      return false;
    } catch {
      setError('Network error. Please check your connection.');
      setPassword('');
      return false;
    }
  }, []);

  const handleTogglePassword = useCallback(() => {
    if (!ndaAccepted) {
      setShowNDA(true);
    } else {
      setShowPassword(prev => !prev);
    }
  }, [ndaAccepted]);

  const handleNDAAccept = useCallback(() => {
    setNdaAccepted(true);
    setShowNDA(false);
    setShowPassword(true);

    // If password was already entered, try to login
    if (password && !isLockedOut) {
      login(password, true);
    }
  }, [password, isLockedOut, login]);

  const handleNDADecline = useCallback(() => {
    setShowNDA(false);
    setShowPassword(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if locked out
    if (isLockedOut) {
      return;
    }

    if (!ndaAccepted) {
      setShowNDA(true);
      return;
    }

    await login(password, ndaAccepted);
  }, [ndaAccepted, password, isLockedOut, login]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Logout failed silently - still clear client state
    }

    setIsAuthenticated(false);
    setPassword('');
    setShowPassword(false);
  }, []);

  return {
    isAuthenticated,
    password,
    showPassword,
    error,
    isLoading,
    showNDA,
    ndaAccepted,
    isLockedOut,
    lockoutTimeRemaining,
    setPassword,
    handleTogglePassword,
    handleNDAAccept,
    handleNDADecline,
    handleSubmit,
    handleLogout
  };
}
