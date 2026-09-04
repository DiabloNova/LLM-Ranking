import { ICacheStore, CacheEntry, CacheSetOptions } from "./types";

export class InMemoryCacheStore implements ICacheStore {
  private store = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt && Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const createdAt = Date.now();
    const expiresAt = options?.ttlSeconds ? createdAt + options.ttlSeconds * 1000 : null;

    this.store.set(key, {
      value,
      createdAt,
      expiresAt
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }
    if (entry.expiresAt && Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async getKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}
