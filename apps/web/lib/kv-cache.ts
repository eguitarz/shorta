type KvNamespace = {
  get: (key: string, type?: 'json') => Promise<any>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

const DEFAULT_NAMESPACE = 'VIRAL_PATTERNS';
const memoryCache = new Map<string, { expiresAt: number; value: any }>();

function getCloudflareEnv(): Record<string, any> | null {
  const context = (globalThis as any)[Symbol.for('__cloudflare-context__')];
  return context?.env ?? null;
}

function getKvNamespace(namespace = DEFAULT_NAMESPACE): KvNamespace | null {
  const env = getCloudflareEnv();
  const kv =
    env?.[namespace] ??
    (globalThis as any)[namespace] ??
    (process.env as any)[namespace];

  if (kv && typeof kv.get === 'function' && typeof kv.put === 'function') {
    return kv as KvNamespace;
  }
  return null;
}

export async function getCachedJson<T>(
  key: string,
  namespace = DEFAULT_NAMESPACE
): Promise<T | null> {
  const kv = getKvNamespace(namespace);
  if (kv) {
    try {
      const cached = await kv.get(key, 'json');
      if (cached) {
        return cached as T;
      }
    } catch (error) {
      console.warn('[KV Cache] Read failed:', error);
    }
  }

  const memoryKey = `${namespace}:${key}`;
  const cached = memoryCache.get(memoryKey);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    memoryCache.delete(memoryKey);
  }

  return null;
}

export async function setCachedJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
  namespace = DEFAULT_NAMESPACE
) {
  const kv = getKvNamespace(namespace);
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
      return;
    } catch (error) {
      console.warn('[KV Cache] Write failed:', error);
    }
  }

  const memoryKey = `${namespace}:${key}`;
  memoryCache.set(memoryKey, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value,
  });
}
