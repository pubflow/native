export type HybridCache = {
  kind: 'lru' | 'redis'
  get(key: string): Promise<string | undefined>
  set(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
}

type LruEntry = { value: string; expiresAt: number }

const MAX_LRU = 5_000

function nowMs() {
  return Date.now()
}

export function createMemoryCache(max = MAX_LRU): HybridCache {
  const store = new Map<string, LruEntry>()

  function touch(key: string, entry: LruEntry) {
    store.delete(key)
    store.set(key, entry)
  }

  function evict() {
    while (store.size > max) {
      const first = store.keys().next().value
      if (first == null) break
      store.delete(first)
    }
  }

  return {
    kind: 'lru',
    async get(key) {
      const entry = store.get(key)
      if (!entry) return undefined
      if (entry.expiresAt <= nowMs()) {
        store.delete(key)
        return undefined
      }
      touch(key, entry)
      return entry.value
    },
    async set(key, value, ttlSeconds = 300) {
      touch(key, { value, expiresAt: nowMs() + Math.max(1, ttlSeconds) * 1000 })
      evict()
    },
    async del(key) {
      store.delete(key)
    },
  }
}

type RedisLike = {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ...extra: unknown[]): Promise<unknown>
  del(key: string): Promise<unknown>
  quit?: () => Promise<unknown>
}

async function connectRedis(url: string): Promise<RedisLike> {
  const ioredisName = 'ioredis'
  const redisName = 'redis'
  try {
    const ioredis = (await import(ioredisName)) as { default?: new (url: string) => RedisLike } & {
      Redis?: new (url: string) => RedisLike
    }
    const Redis = ioredis.default || ioredis.Redis
    if (!Redis) throw new Error('no ioredis')
    return new Redis(url)
  } catch {
    const redis = (await import(redisName)) as {
      createClient: (opts: { url: string }) => RedisLike & { connect: () => Promise<void> }
    }
    const client = redis.createClient({ url })
    await client.connect()
    return client
  }
}

function redisCache(client: RedisLike): HybridCache {
  return {
    kind: 'redis',
    async get(key) {
      const value = await client.get(key)
      return value == null ? undefined : value
    },
    async set(key, value, ttlSeconds = 300) {
      const ttl = Math.max(1, ttlSeconds)
      try {
        await client.set(key, value, 'EX', ttl)
      } catch {
        await client.set(key, value, { EX: ttl } as never)
      }
    },
    async del(key) {
      await client.del(key)
    },
  }
}

function redisUrl(env: NodeJS.ProcessEnv): string {
  if (env.REDIS_URL) return env.REDIS_URL
  const host = env.REDIS_HOST
  if (!host) return ''
  const port = env.REDIS_PORT || '6379'
  const password = env.REDIS_PASSWORD
  if (password) return `redis://:${encodeURIComponent(password)}@${host}:${port}`
  return `redis://${host}:${port}`
}

/**
 * Redis XOR LRU. Redis configured → Redis only. Redis missing → LRU.
 * Redis configured but failing → temporary LRU (not dual-write).
 */
export function createHybridCache(env: NodeJS.ProcessEnv = process.env): HybridCache {
  const url = redisUrl(env)
  if (!url) return createMemoryCache()

  const fallback = createMemoryCache()
  let redis: HybridCache | null = null
  let connecting: Promise<HybridCache | null> | null = null
  let failed = false

  async function backend(): Promise<HybridCache> {
    if (redis) return redis
    if (failed) return fallback
    if (!connecting) {
      connecting = connectRedis(url)
        .then((client) => {
          redis = redisCache(client)
          return redis
        })
        .catch((error) => {
          failed = true
          connecting = null
          console.warn('[pubflow-native] Redis unavailable, using in-process LRU:', error)
          return null
        })
    }
    return (await connecting) || fallback
  }

  return {
    kind: 'redis',
    async get(key) {
      return (await backend()).get(key)
    },
    async set(key, value, ttlSeconds) {
      return (await backend()).set(key, value, ttlSeconds)
    },
    async del(key) {
      return (await backend()).del(key)
    },
  }
}

let singleton: HybridCache | null = null
let singletonKey = ''

export function getHybridCache(env: NodeJS.ProcessEnv = process.env): HybridCache {
  const key = redisUrl(env) || 'lru'
  if (singleton && singletonKey === key) return singleton
  singleton = createHybridCache(env)
  singletonKey = key
  return singleton
}

export function resetHybridCache(): void {
  singleton = null
  singletonKey = ''
}
