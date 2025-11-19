/**
 * Shared Authentication Hook
 *
 * SECURITY WARNING: This currently uses client-side authentication which is NOT secure.
 * The password is stored in environment variables but still validated in the browser.
 *
 * TODO: Migrate to proper server-side authentication with:
 * - Server-side password validation
 * - JWT tokens or secure session management
 * - httpOnly cookies
 * - Rate limiting at the server level
 *
 * For production use, this must be replaced with proper authentication.
 */

import { useState, useEffect, useCallback } from 'react';

// Storage keys
const enum StorageKeys {
  AUTH = 'site-authenticated',
  NDA = 'nda-accepted',
  AUTH_TIMESTAMP = 'auth-timestamp',
  FAILED_ATTEMPTS = 'failed-attempts',
  LOCKOUT_UNTIL = 'lockout-until'
}

// Configuration
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

// Get password from environment variable or fallback to hardcoded (NOT SECURE)
const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_SITE_PASSWORD || '1234abcd';

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

  // Check if user is locked out
  const checkLockout = useCallback((): boolean => {
    const lockoutUntil = sessionStorage.getItem(StorageKeys.LOCKOUT_UNTIL);
    if (lockoutUntil) {
      const lockoutTime = parseInt(lockoutUntil, 10);
      const now = Date.now();

      if (now < lockoutTime) {
        const remaining = Math.ceil((lockoutTime - now) / 1000);
        setIsLockedOut(true);
        setLockoutTimeRemaining(remaining);
        return true;
      } else {
        // Lockout expired, clear it
        sessionStorage.removeItem(StorageKeys.LOCKOUT_UNTIL);
        sessionStorage.removeItem(StorageKeys.FAILED_ATTEMPTS);
        setIsLockedOut(false);
        setLockoutTimeRemaining(0);
      }
    }
    return false;
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem(StorageKeys.AUTH);
    const authTimestamp = sessionStorage.getItem(StorageKeys.AUTH_TIMESTAMP);
    const ndaStatus = sessionStorage.getItem(StorageKeys.NDA);

    // Check if session has expired
    if (authStatus === 'true' && authTimestamp) {
      const loginTime = parseInt(authTimestamp, 10);
      const now = Date.now();

      if (now - loginTime > SESSION_TIMEOUT_MS) {
        // Session expired, clear auth
        sessionStorage.removeItem(StorageKeys.AUTH);
        sessionStorage.removeItem(StorageKeys.AUTH_TIMESTAMP);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    }

    if (ndaStatus === 'true') {
      setNdaAccepted(true);
    }

    checkLockout();
    setIsLoading(false);
  }, [checkLockout]);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLockedOut || lockoutTimeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setLockoutTimeRemaining(prev => {
        if (prev <= 1) {
          setIsLockedOut(false);
          sessionStorage.removeItem(StorageKeys.LOCKOUT_UNTIL);
          sessionStorage.removeItem(StorageKeys.FAILED_ATTEMPTS);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimeRemaining]);

  // Validate password and handle authentication
  const validatePassword = useCallback((passwordToValidate: string): boolean => {
    if (passwordToValidate === CORRECT_PASSWORD) {
      // Successful login
      sessionStorage.setItem(StorageKeys.AUTH, 'true');
      sessionStorage.setItem(StorageKeys.AUTH_TIMESTAMP, Date.now().toString());
      sessionStorage.removeItem(StorageKeys.FAILED_ATTEMPTS);
      sessionStorage.removeItem(StorageKeys.LOCKOUT_UNTIL);
      setIsAuthenticated(true);
      setError('');
      setPassword(''); // Clear password from state immediately
      return true;
    } else {
      // Failed login
      const failedAttempts = parseInt(
        sessionStorage.getItem(StorageKeys.FAILED_ATTEMPTS) || '0',
        10
      ) + 1;

      sessionStorage.setItem(StorageKeys.FAILED_ATTEMPTS, failedAttempts.toString());

      if (failedAttempts >= MAX_ATTEMPTS) {
        // Trigger lockout
        const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        sessionStorage.setItem(StorageKeys.LOCKOUT_UNTIL, lockoutUntil.toString());
        setIsLockedOut(true);
        setLockoutTimeRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setError(`Too many failed attempts. Please wait ${Math.ceil(LOCKOUT_DURATION_MS / 1000)} seconds.`);
      } else {
        const attemptsRemaining = MAX_ATTEMPTS - failedAttempts;
        setError(`Incorrect password. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`);
      }

      setPassword(''); // Clear password from state
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
    sessionStorage.setItem(StorageKeys.NDA, 'true');
    setShowNDA(false);
    setShowPassword(true);

    // If password was already entered, validate it immediately
    if (password && !checkLockout()) {
      validatePassword(password);
    }
  }, [password, checkLockout, validatePassword]);

  const handleNDADecline = useCallback(() => {
    setShowNDA(false);
    setShowPassword(false);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Check if locked out
    if (checkLockout()) {
      return;
    }

    if (!ndaAccepted) {
      setShowNDA(true);
      return;
    }

    validatePassword(password);
  }, [ndaAccepted, password, checkLockout, validatePassword]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(StorageKeys.AUTH);
    sessionStorage.removeItem(StorageKeys.AUTH_TIMESTAMP);
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
