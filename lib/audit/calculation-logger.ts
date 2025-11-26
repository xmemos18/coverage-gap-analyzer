/**
 * Calculation Audit Logger
 *
 * Provides utilities for logging calculation inputs and outputs for
 * audit, debugging, and reproducibility purposes.
 */

/**
 * Calculation log entry
 */
export interface CalculationLogEntry {
  id: string;
  timestamp: number;
  calculationType: CalculationType;
  inputHash: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration: number; // in milliseconds
  version: string;
  metadata?: {
    userAgent?: string;
    sessionId?: string;
    source?: string;
  };
}

/**
 * Supported calculation types
 */
export type CalculationType =
  | 'subsidy'
  | 'cost-projection'
  | 'monte-carlo'
  | 'break-even'
  | 'hsa'
  | 'magi'
  | 'plan-comparison'
  | 'medicare-transition'
  | 'job-change';

/**
 * Log storage interface
 */
export interface LogStorage {
  save(entry: CalculationLogEntry): void;
  getAll(): CalculationLogEntry[];
  getById(id: string): CalculationLogEntry | null;
  getByHash(hash: string): CalculationLogEntry[];
  getByType(type: CalculationType): CalculationLogEntry[];
  getRecent(limit: number): CalculationLogEntry[];
  clear(): void;
}

/**
 * Simple djb2 hash function
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Generate a stable hash for calculation input
 * Ignores ordering and handles nested objects
 */
export function hashInput(input: Record<string, unknown>): string {
  // Sort keys recursively for stable hashing
  const sortedInput = sortObjectKeys(input);
  const json = JSON.stringify(sortedInput);
  return hashString(json);
}

/**
 * Sort object keys recursively for stable JSON
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Generate unique log ID
 */
function generateLogId(): string {
  return `log_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * LocalStorage-based log storage
 */
class LocalStorageLogStorage implements LogStorage {
  private readonly storageKey = 'calculation_logs';
  private readonly maxEntries = 100;

  save(entry: CalculationLogEntry): void {
    if (typeof window === 'undefined') return;

    const logs = this.getAll();
    logs.unshift(entry);

    // Trim to max entries
    const trimmed = logs.slice(0, this.maxEntries);
    localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
  }

  getAll(): CalculationLogEntry[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      return JSON.parse(stored) as CalculationLogEntry[];
    } catch {
      return [];
    }
  }

  getById(id: string): CalculationLogEntry | null {
    return this.getAll().find((entry) => entry.id === id) || null;
  }

  getByHash(hash: string): CalculationLogEntry[] {
    return this.getAll().filter((entry) => entry.inputHash === hash);
  }

  getByType(type: CalculationType): CalculationLogEntry[] {
    return this.getAll().filter((entry) => entry.calculationType === type);
  }

  getRecent(limit: number): CalculationLogEntry[] {
    return this.getAll().slice(0, limit);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.storageKey);
  }
}

/**
 * In-memory log storage (for server-side or testing)
 */
class InMemoryLogStorage implements LogStorage {
  private logs: CalculationLogEntry[] = [];
  private readonly maxEntries = 100;

  save(entry: CalculationLogEntry): void {
    this.logs.unshift(entry);
    this.logs = this.logs.slice(0, this.maxEntries);
  }

  getAll(): CalculationLogEntry[] {
    return [...this.logs];
  }

  getById(id: string): CalculationLogEntry | null {
    return this.logs.find((entry) => entry.id === id) || null;
  }

  getByHash(hash: string): CalculationLogEntry[] {
    return this.logs.filter((entry) => entry.inputHash === hash);
  }

  getByType(type: CalculationType): CalculationLogEntry[] {
    return this.logs.filter((entry) => entry.calculationType === type);
  }

  getRecent(limit: number): CalculationLogEntry[] {
    return this.logs.slice(0, limit);
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * Calculation Logger class
 */
export class CalculationLogger {
  private storage: LogStorage;
  private version: string;
  private metadata: CalculationLogEntry['metadata'];

  constructor(
    storage?: LogStorage,
    version: string = '1.0.0',
    metadata?: CalculationLogEntry['metadata']
  ) {
    this.storage = storage || (typeof window !== 'undefined' ? new LocalStorageLogStorage() : new InMemoryLogStorage());
    this.version = version;
    this.metadata = metadata;
  }

  /**
   * Log a calculation with timing
   */
  logCalculation<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>>(
    type: CalculationType,
    input: TInput,
    calculationFn: (input: TInput) => TOutput
  ): TOutput {
    const startTime = performance.now();
    const output = calculationFn(input);
    const duration = performance.now() - startTime;

    const entry: CalculationLogEntry = {
      id: generateLogId(),
      timestamp: Date.now(),
      calculationType: type,
      inputHash: hashInput(input),
      input,
      output: output as Record<string, unknown>,
      duration,
      version: this.version,
      metadata: this.metadata,
    };

    this.storage.save(entry);
    return output;
  }

  /**
   * Log an async calculation with timing
   */
  async logAsyncCalculation<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>>(
    type: CalculationType,
    input: TInput,
    calculationFn: (input: TInput) => Promise<TOutput>
  ): Promise<TOutput> {
    const startTime = performance.now();
    const output = await calculationFn(input);
    const duration = performance.now() - startTime;

    const entry: CalculationLogEntry = {
      id: generateLogId(),
      timestamp: Date.now(),
      calculationType: type,
      inputHash: hashInput(input),
      input,
      output: output as Record<string, unknown>,
      duration,
      version: this.version,
      metadata: this.metadata,
    };

    this.storage.save(entry);
    return output;
  }

  /**
   * Manually log a completed calculation
   */
  log(
    type: CalculationType,
    input: Record<string, unknown>,
    output: Record<string, unknown>,
    duration: number
  ): CalculationLogEntry {
    const entry: CalculationLogEntry = {
      id: generateLogId(),
      timestamp: Date.now(),
      calculationType: type,
      inputHash: hashInput(input),
      input,
      output,
      duration,
      version: this.version,
      metadata: this.metadata,
    };

    this.storage.save(entry);
    return entry;
  }

  /**
   * Get all logs
   */
  getLogs(): CalculationLogEntry[] {
    return this.storage.getAll();
  }

  /**
   * Get log by ID
   */
  getLog(id: string): CalculationLogEntry | null {
    return this.storage.getById(id);
  }

  /**
   * Get logs by input hash (for finding duplicate calculations)
   */
  getLogsByHash(hash: string): CalculationLogEntry[] {
    return this.storage.getByHash(hash);
  }

  /**
   * Get logs by calculation type
   */
  getLogsByType(type: CalculationType): CalculationLogEntry[] {
    return this.storage.getByType(type);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 10): CalculationLogEntry[] {
    return this.storage.getRecent(limit);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.storage.clear();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      exportedAt: Date.now(),
      version: this.version,
      logs: this.storage.getAll(),
    }, null, 2);
  }

  /**
   * Get calculation statistics
   */
  getStats(): {
    totalCalculations: number;
    byType: Record<CalculationType, number>;
    averageDuration: number;
    uniqueInputs: number;
  } {
    const logs = this.storage.getAll();

    const byType: Record<string, number> = {};
    const hashes = new Set<string>();
    let totalDuration = 0;

    for (const log of logs) {
      byType[log.calculationType] = (byType[log.calculationType] || 0) + 1;
      hashes.add(log.inputHash);
      totalDuration += log.duration;
    }

    return {
      totalCalculations: logs.length,
      byType: byType as Record<CalculationType, number>,
      averageDuration: logs.length > 0 ? totalDuration / logs.length : 0,
      uniqueInputs: hashes.size,
    };
  }

  /**
   * Find cached result for same input
   */
  findCachedResult(type: CalculationType, input: Record<string, unknown>): Record<string, unknown> | null {
    const hash = hashInput(input);
    const matches = this.storage.getByHash(hash).filter(
      (entry) => entry.calculationType === type
    );

    if (matches.length === 0) return null;

    // Return most recent match
    const mostRecent = matches[0];
    return mostRecent ? mostRecent.output : null;
  }
}

/**
 * Default logger instance
 */
export const defaultLogger = new CalculationLogger();

/**
 * Create a new logger with custom settings
 */
export function createLogger(
  version?: string,
  metadata?: CalculationLogEntry['metadata']
): CalculationLogger {
  return new CalculationLogger(undefined, version, metadata);
}

/**
 * Create an in-memory logger (for testing or server-side)
 */
export function createInMemoryLogger(
  version?: string,
  metadata?: CalculationLogEntry['metadata']
): CalculationLogger {
  return new CalculationLogger(new InMemoryLogStorage(), version, metadata);
}

// Export storage classes for custom implementations
export { LocalStorageLogStorage, InMemoryLogStorage };
