/**
 * Distributed Redis Cache Client
 * Uses Upstash Redis for distributed caching across server instances
 * Falls back to in-memory cache if Redis is not configured
 * @module lib/cache/redis
 */

import { logger } from '@/lib/logger';

/**
 * Redis client interface
 */
interface RedisClient {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, options?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
  ttl: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<void>;
}

/**
 * In-memory cache fallback for local development
 */
class InMemoryCache implements RedisClient {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();
  private maxSize = 1000;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const expiresAt = options?.ex
      ? Date.now() + options.ex * 1000
      : Date.now() + 24 * 60 * 60 * 1000; // Default 24 hours

    this.cache.set(key, { data: value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return -2; // Key doesn't exist

    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) {
      this.cache.delete(key);
      return -2;
    }

    return Math.floor(remaining / 1000); // Return seconds
  }

  async incr(key: string): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = (current || 0) + 1;
    await this.set(key, newValue, { ex: 60 }); // Default 60 seconds for counters
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }

  // Cleanup expired entries periodically
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 60 * 1000); // Every minute
  }
}

/**
 * Upstash Redis client wrapper
 */
class UpstashRedisClient implements RedisClient {
  private baseUrl: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  private async executeCommand<T>(command: string[]): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${command.join('/')}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Redis command failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result as T;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.executeCommand<string | null>(['GET', key]);
      if (result === null) return null;

      // Try to parse as JSON
      try {
        return JSON.parse(result) as T;
      } catch {
        return result as T;
      }
    } catch (error) {
      logger.error('Redis GET error', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      const command = ['SET', key, serialized];

      if (options?.ex) {
        command.push('EX', options.ex.toString());
      }

      await this.executeCommand(command);
    } catch (error) {
      logger.error('Redis SET error', { key, error });
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.executeCommand(['DEL', key]);
    } catch (error) {
      logger.error('Redis DEL error', { key, error });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.executeCommand<number>(['EXISTS', key]);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.executeCommand<number>(['TTL', key]);
    } catch (error) {
      logger.error('Redis TTL error', { key, error });
      return -2;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.executeCommand<number>(['INCR', key]);
    } catch (error) {
      logger.error('Redis INCR error', { key, error });
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.executeCommand(['EXPIRE', key, seconds.toString()]);
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, error });
    }
  }
}

/**
 * Create and configure Redis client
 */
function createRedisClient(): RedisClient {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    logger.info('Using Upstash Redis for distributed caching');
    return new UpstashRedisClient(url, token);
  } else {
    logger.warn(
      'Redis not configured - using in-memory cache (not suitable for production with multiple instances)'
    );
    const inMemoryCache = new InMemoryCache();
    inMemoryCache.startCleanup();
    return inMemoryCache;
  }
}

// Singleton instance
let redisClient: RedisClient | null = null;

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient(): RedisClient {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * Cache wrapper with automatic key prefixing and TTL
 */
export class CacheManager {
  private client: RedisClient;
  private prefix: string;
  private defaultTTL: number;

  /**
   * @param prefix - Prefix for all cache keys (e.g., 'marketplace-plans')
   * @param defaultTTL - Default TTL in seconds (default: 24 hours)
   */
  constructor(prefix: string, defaultTTL: number = 24 * 60 * 60) {
    this.client = getRedisClient();
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    return await this.client.get<T>(fullKey);
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const fullKey = this.getKey(key);
    const ttl = ttlSeconds || this.defaultTTL;
    await this.client.set(fullKey, value, { ex: ttl });
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    await this.client.del(fullKey);
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    return await this.client.exists(fullKey);
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.client.ttl(fullKey);
  }

  /**
   * Cache a function result with automatic key generation
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }
}

/**
 * Rate limiter using Redis
 */
export class RateLimiter {
  private client: RedisClient;
  private prefix: string;
  private maxRequests: number;
  private windowSeconds: number;

  /**
   * @param prefix - Prefix for rate limit keys (e.g., 'rate-limit:api')
   * @param maxRequests - Maximum requests per window
   * @param windowSeconds - Time window in seconds
   */
  constructor(prefix: string, maxRequests: number, windowSeconds: number) {
    this.client = getRedisClient();
    this.prefix = prefix;
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
  }

  private getKey(identifier: string): string {
    return `${this.prefix}:${identifier}`;
  }

  /**
   * Check rate limit for an identifier (e.g., IP address)
   * @returns { allowed, remaining, resetTime }
   */
  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.getKey(identifier);

    try {
      // Increment counter
      const count = await this.client.incr(key);

      // Set expiry on first request
      if (count === 1) {
        await this.client.expire(key, this.windowSeconds);
      }

      // Get TTL to calculate reset time
      const ttl = await this.client.ttl(key);
      const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : this.windowSeconds * 1000);

      const allowed = count <= this.maxRequests;
      const remaining = Math.max(0, this.maxRequests - count);

      return { allowed, remaining, resetTime };
    } catch (error) {
      logger.error('Rate limit check failed', { identifier, error });
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowSeconds * 1000,
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    await this.client.del(key);
  }
}

/**
 * Helper to generate cache keys from objects
 */
export function generateCacheKey(type: string, params: Record<string, unknown>): string {
  // Sort keys for consistent cache keys
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);

  return `${type}:${JSON.stringify(sortedParams)}`;
}

// Export default instance for simple usage
export const redis = getRedisClient();
