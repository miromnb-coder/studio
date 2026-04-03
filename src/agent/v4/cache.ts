import { createHash } from 'node:crypto';

type CacheValueEnvelope<T> = {
  expiresAt: number;
  value: T;
};

export interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del?(key: string): Promise<void>;
}

export class InMemoryCacheBackend implements CacheBackend {
  private store = new Map<string, CacheValueEnvelope<string>>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

type RedisLikeClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', seconds: number): Promise<unknown>;
  del?(key: string): Promise<unknown>;
};

export function createRedisCacheBackend(client: RedisLikeClient): CacheBackend {
  return {
    get: (key) => client.get(key),
    set: async (key, value, ttlSeconds) => {
      await client.set(key, value, 'EX', ttlSeconds);
    },
    del: async (key) => {
      if (client.del) {
        await client.del(key);
      }
    }
  };
}

export function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function historyFingerprint(history: any[], recentCount = 6): string {
  const recent = history
    .slice(-recentCount)
    .map((item) => {
      const role = typeof item?.role === 'string' ? item.role : 'unknown';
      const contentRaw = typeof item?.content === 'string' ? item.content : JSON.stringify(item?.content ?? '');
      return `${role}:${normalizeInput(contentRaw).slice(0, 300)}`;
    })
    .join('|');

  return createHash('sha256').update(recent).digest('hex');
}

export function createCacheKey(scope: string, userId: string, input: string, history: any[]): string {
  const normalized = normalizeInput(input);
  const fingerprint = historyFingerprint(history);
  const digest = createHash('sha256').update(`${userId}|${normalized}|${fingerprint}`).digest('hex');
  return `agent-v4:${scope}:${digest}`;
}

export async function getJsonCache<T>(backend: CacheBackend, key: string): Promise<T | null> {
  const payload = await backend.get(key);
  if (!payload) return null;
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

export async function setJsonCache<T>(backend: CacheBackend, key: string, value: T, ttlSeconds: number): Promise<void> {
  await backend.set(key, JSON.stringify(value), ttlSeconds);
}

const VOLATILE_KEYWORDS = [
  'latest',
  'today',
  'current',
  'now',
  'breaking',
  'news',
  'weather',
  'stock',
  'price',
  'market',
  'web search',
  'search the web',
  'real-time',
  'realtime',
  'timestamp',
  'date',
  'time'
];

export function shouldBypassCacheForInput(input: string): boolean {
  const normalized = normalizeInput(input);
  return VOLATILE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

