/**
 * Phase 7C.5 — Enterprise In-Memory Cache Infrastructure
 * High-performance generic cache store with TTL-based expiration support.
 */

export interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache {
  private store: Map<string, CacheItem<unknown>> = new Map();

  /**
   * Set a cached key-value item with an optional Time-To-Live (TTL) in milliseconds
   */
  public set<T>(key: string, value: T, ttlMs = 60000): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Get a cached item, returning null if expired or missing
   */
  public get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

// Global cached controller instance
export const coreCache = new InMemoryCache();
