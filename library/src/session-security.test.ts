import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { createMemoryCache } from './cache.ts'
import {
  applySessionSecurity,
  compareBind,
  readSessionSecurityConfig,
  type SessionBind,
} from './session-security.ts'

const stored: SessionBind = { ip: '203.0.113.1', userAgent: 'Mozilla/5.0', device: '"Chromium"' }
const other: SessionBind = { ip: '198.51.100.2', userAgent: 'Other/1.0', device: '"Firefox"' }

describe('session security modes', () => {
  it('maps AUTH_VALIDATION_MODE to implied flags', () => {
    expect(readSessionSecurityConfig({ AUTH_VALIDATION_MODE: 'DISABLED' }).ip).toBe(false)
    expect(readSessionSecurityConfig({ AUTH_VALIDATION_MODE: 'STANDARD' })).toMatchObject({
      ip: true,
      userAgent: false,
      autoInvalidate: false,
    })
    expect(readSessionSecurityConfig({ AUTH_VALIDATION_MODE: 'ADVANCED' }).userAgent).toBe(true)
    expect(readSessionSecurityConfig({ AUTH_VALIDATION_MODE: 'STRICT' }).device).toBe(false)
  })

  it('STANDARD logs IP mismatch but compare still returns the violation', () => {
    const config = readSessionSecurityConfig({ AUTH_VALIDATION_MODE: 'STANDARD' })
    expect(compareBind(stored, other, config).map((v) => v.type)).toEqual(['IP_MISMATCH'])
  })

  it('binds on first request and 401s on STRICT IP change; logout only when AUTO_INVALIDATE', async () => {
    const cache = createMemoryCache()
    const config = readSessionSecurityConfig({
      AUTH_VALIDATION_MODE: 'STRICT',
      AUTH_AUTO_INVALIDATE: 'true',
    })
    let logouts = 0
    process.env.TRUST_PROXY = 'true'
    const app = new Hono()
    app.get('/', async (c) => {
      await applySessionSecurity(c, 'sess-1', {
        cache,
        config,
        logout: async () => {
          logouts += 1
        },
      })
      return c.json({ ok: true })
    })

    const first = await app.request('/', { headers: { 'CF-Connecting-IP': stored.ip, 'user-agent': stored.userAgent } })
    expect(first.status).toBe(200)

    const second = await app.request('/', { headers: { 'CF-Connecting-IP': other.ip, 'user-agent': stored.userAgent } })
    expect(second.status).toBe(401)
    expect(logouts).toBe(1)

    const allowConfig = readSessionSecurityConfig({ AUTH_VALIDATION_MODE: 'STANDARD' })
    const app2 = new Hono()
    app2.get('/', async (c) => {
      await applySessionSecurity(c, 'sess-2', { cache, config: allowConfig })
      return c.json({ ok: true })
    })
    await app2.request('/', { headers: { 'CF-Connecting-IP': stored.ip } })
    const allowed = await app2.request('/', { headers: { 'CF-Connecting-IP': other.ip } })
    expect(allowed.status).toBe(200)
    delete process.env.TRUST_PROXY
  })
})
