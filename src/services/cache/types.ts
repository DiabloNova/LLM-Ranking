export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number | null;
}

export interface CacheSetOptions {
  ttlSeconds?: number;
}

export interface ICacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getKeys(): Promise<string[]>; // helpful for prefix invalidation
}
