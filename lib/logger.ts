/**
 * Centralized logging utility
 * Provides structured logging with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

/**
 * Logger configuration
 */
const config = {
  // Only log in development, test, or when explicitly enabled
  enabled: process.env.NODE_ENV === 'development' ||
           process.env.NODE_ENV === 'test' ||
           process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true',
  // Minimum log level to display
  minLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'debug',
};

/**
 * Log level priority for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Check if a log level should be displayed
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

/**
 * Format log entry for display
 */
function formatLog(entry: LogEntry): string {
  const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
  return entry.data
    ? `${prefix} - ${entry.message}`
    : `${prefix} - ${entry.message}`;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  const formattedMessage = formatLog(entry);

  switch (level) {
    case 'debug':
      console.debug(formattedMessage, data || '');
      break;
    case 'info':
      console.info(formattedMessage, data || '');
      break;
    case 'warn':
      console.warn(formattedMessage, data || '');
      break;
    case 'error':
      console.error(formattedMessage, data || '');
      break;
  }
}

/**
 * Exported logger interface
 */
export const logger = {
  /**
   * Debug-level logging (development only)
   * Use for detailed debugging information
   */
  debug: (message: string, data?: unknown) => log('debug', message, data),

  /**
   * Info-level logging
   * Use for general informational messages
   */
  info: (message: string, data?: unknown) => log('info', message, data),

  /**
   * Warning-level logging
   * Use for non-critical issues that should be noted
   */
  warn: (message: string, data?: unknown) => log('warn', message, data),

  /**
   * Error-level logging
   * Use for errors and exceptions
   */
  error: (message: string, data?: unknown) => log('error', message, data),

  /**
   * Check if logging is enabled
   */
  isEnabled: () => config.enabled,
};

/**
 * Development-only logger
 * These logs are automatically stripped in production builds
 */
export const devLogger = {
  log: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log(`[DEV] ${message}`, data || '');
    }
  },

  table: (data: unknown) => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.table(data);
    }
  },

  group: (label: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.groupEnd();
    }
  },
};

/**
 * Performance logging helper
 */
export const perfLogger = {
  start: (label: string): (() => void) => {
    if (!config.enabled) return () => {};

    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      logger.debug(`${label} took ${duration.toFixed(2)}ms`);
    };
  },
};
