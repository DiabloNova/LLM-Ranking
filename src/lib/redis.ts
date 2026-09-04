import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } else {
    console.warn('Redis environment variables are not set. Caching will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

/**
 * Retrieves data from the Redis cache.
 * Fail-open design: returns null if the cache is unavailable or an error occurs.
 *
 * @param key - The cache key.
 * @returns The parsed cached data of type T, or null on cache miss or failure.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    return await redis.get<T>(key);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Redis get error for key "${key}":`, message);
    return null;
  }
}

/**
 * Stores data in the Redis cache.
 * Fail-open design: logs the error and returns false if the operation fails.
 *
 * @param key - The cache key.
 * @param value - The value to cache.
 * @param ttlInSeconds - Optional Time-To-Live in seconds.
 * @returns True if the value was successfully cached, false otherwise.
 */
export async function setCachedData<T>(key: string, value: T, ttlInSeconds?: number): Promise<boolean> {
  if (!redis) return false;

  try {
    if (ttlInSeconds !== undefined && ttlInSeconds > 0) {
      await redis.set(key, value, { ex: ttlInSeconds });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Redis set error for key "${key}":`, message);
    return false;
  }
}
