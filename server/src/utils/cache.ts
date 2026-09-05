/**
 * High-Performance In-Memory Cache with TTL & Prefix Invalidation
 * Provides < 3ms response times for frequently accessed datasets.
 */

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 60 * 1000; // 60 seconds default

  constructor() {
    // Cleanup expired items every 2 minutes
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set(key: string, value: any, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  public invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public invalidateAll(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const serverCache = new MemoryCache();
