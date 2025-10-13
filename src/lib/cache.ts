// src/lib/cache.ts
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<any>>();

export function setCache<T>(key: string, value: T, ttl = 60_000) {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}
