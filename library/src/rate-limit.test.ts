import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { createMemoryCache } from './cache.ts'
import { consumeRateLimit, rateLimit } from './rate-limit.ts'

describe('rateLimit', () => {
  it('allows up to max then 429s', async () => {
    const cache = createMemoryCache()
    const first = await consumeRateLimit('t:1', { max: 2, windowSeconds: 60, cache })
    const second = await consumeRateLimit('t:1', { max: 2, windowSeconds: 60, cache })
    const third = await consumeRateLimit('t:1', { max: 2, windowSeconds: 60, cache })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(third.ok).toBe(false)
    expect(third.remaining).toBe(0)
  })

  it('keys by IP on the Hono middleware', async () => {
    const cache = createMemoryCache()
    const app = new Hono()
    app.use('*', rateLimit({ max: 1, windowSeconds: 60, cache, prefix: 'test' }))
    app.get('/', (c) => c.json({ ok: true }))
    process.env.TRUST_PROXY = 'true'
    const headers = { 'CF-Connecting-IP': '203.0.113.10' }
    expect((await app.request('/', { headers })).status).toBe(200)
    expect((await app.request('/', { headers })).status).toBe(429)
    delete process.env.TRUST_PROXY
  })
})
