// In-memory LRU-style cache with TTL. Sufficient for MVP.
// For production scale, swap for Redis or Firestore-backed cache.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const TTL_MULTIPLIERS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function parseTTL(ttl: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(ttl);
  if (!match) throw new Error(`Invalid TTL: "${ttl}"`);
  return parseInt(match[1], 10) * TTL_MULTIPLIERS[match[2]];
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) { this.store.delete(key); return null; }
    return entry.value;
  }

  set<T>(key: string, value: T, ttl: string): void {
    this.store.set(key, { value, expiresAt: Date.now() + parseTTL(ttl) });
  }

  async getOrSet<T>(key: string, ttl: string, factory: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await factory();
    this.set(key, fresh, ttl);
    return fresh;
  }
}

let _instance: MemoryCache | null = null;
export function getCache(): MemoryCache {
  if (!_instance) _instance = new MemoryCache();
  return _instance;
}
