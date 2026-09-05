import { afterEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { getClientIp, isTrustProxy, parseCorsOrigins, resolveCorsOrigin } from './http.ts'

const original = { ...process.env }

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key]
  }
  Object.assign(process.env, original)
})

function appIp() {
  const app = new Hono()
  app.get('/', (c) => c.json({ ip: getClientIp(c) }))
  return app
}

describe('getClientIp', () => {
  it('ignores X-Forwarded-For when TRUST_PROXY is false', async () => {
    process.env.TRUST_PROXY = 'false'
    process.env.NODE_ENV = 'development'
    const res = await appIp().request('/', { headers: { 'X-Forwarded-For': '203.0.113.9' } })
    expect(await res.json()).toEqual({ ip: 'unknown' })
  })

  it('uses CF-Connecting-IP then X-Forwarded-For leftmost when trusted', async () => {
    process.env.TRUST_PROXY = 'true'
    const app = appIp()
    const cf = await app.request('/', { headers: { 'CF-Connecting-IP': '198.51.100.4', 'X-Forwarded-For': '203.0.113.9' } })
    expect(await cf.json()).toEqual({ ip: '198.51.100.4' })
    const xff = await app.request('/', { headers: { 'X-Forwarded-For': '203.0.113.9, 10.0.0.1' } })
    expect(await xff.json()).toEqual({ ip: '203.0.113.9' })
  })

  it('prefers platform IP on c.env over spoofed headers', async () => {
    process.env.TRUST_PROXY = 'false'
    const app = new Hono<{ Bindings: { CF_CONNECTING_IP: string } }>()
    app.get('/', (c) => c.json({ ip: getClientIp(c) }))
    const res = await app.request('/', { headers: { 'X-Forwarded-For': '203.0.113.9' } }, { CF_CONNECTING_IP: '198.51.100.20' })
    expect(await res.json()).toEqual({ ip: '198.51.100.20' })
  })

  it('strips IPv6-mapped IPv4', async () => {
    process.env.TRUST_PROXY = 'true'
    const res = await appIp().request('/', { headers: { 'X-Real-IP': '::ffff:192.0.2.8' } })
    expect(await res.json()).toEqual({ ip: '192.0.2.8' })
  })
})

describe('isTrustProxy / CORS origins', () => {
  it('defaults trust proxy to production only', () => {
    expect(isTrustProxy({ NODE_ENV: 'development' })).toBe(false)
    expect(isTrustProxy({ NODE_ENV: 'production' })).toBe(true)
    expect(isTrustProxy({ NODE_ENV: 'production', TRUST_PROXY: 'false' })).toBe(false)
  })

  it('parses CORS_ORIGINS and same-origin in production', async () => {
    expect(parseCorsOrigins('https://a.example, https://b.example')).toEqual(['https://a.example', 'https://b.example'])
    process.env.NODE_ENV = 'production'
    process.env.CORS_ORIGINS = ''
    process.env.APP_URL = 'https://app.example'
    const app = new Hono()
    app.get('/', (c) => c.json({ origin: resolveCorsOrigin(c.req.header('origin') || '', c) }))
    const res = await app.request('/', { headers: { origin: 'https://app.example' } })
    expect(await res.json()).toEqual({ origin: 'https://app.example' })
  })

  it('allows localhost origins in development when CORS_ORIGINS is empty', async () => {
    process.env.NODE_ENV = 'development'
    process.env.CORS_ORIGINS = ''
    process.env.PORT = '3000'
    const app = new Hono()
    app.get('/', (c) => c.json({ origin: resolveCorsOrigin(c.req.header('origin') || '', c) || null }))
    const ok = await app.request('/', { headers: { origin: 'http://localhost:3000' } })
    expect(await ok.json()).toEqual({ origin: 'http://localhost:3000' })
    const bad = await app.request('/', { headers: { origin: 'https://evil.example' } })
    expect(await bad.json()).toEqual({ origin: null })
  })
})
