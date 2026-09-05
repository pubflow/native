import { describe, expect, it } from 'bun:test'
import { createHybridCache, createMemoryCache } from './cache.ts'

describe('HybridCache', () => {
  it('stores and removes LRU entries', async () => {
    const cache = createMemoryCache(2)
    await cache.set('a', '1', 60)
    expect(await cache.get('a')).toBe('1')
    await cache.del('a')
    expect(await cache.get('a')).toBeUndefined()
  })

  it('uses LRU when REDIS_URL is missing', () => {
    const cache = createHybridCache({} as NodeJS.ProcessEnv)
    expect(cache.kind).toBe('lru')
  })

  it('reports redis kind when REDIS_URL is set (XOR, not dual-write)', () => {
    const cache = createHybridCache({ REDIS_URL: 'redis://127.0.0.1:9' } as NodeJS.ProcessEnv)
    expect(cache.kind).toBe('redis')
  })
})
