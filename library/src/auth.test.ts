import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { createAuth } from './auth.ts'
import { isAnyType, parseAllowedTypes, sessionAllowed } from './access.ts'
import type { ActionSession } from './access.ts'

describe('isAnyType / sessionAllowed', () => {
  const session: ActionSession = { user_id: '1', user_type: 'user' }

  it('treats any, authenticated, * and empty as any signed-in user', () => {
    expect(isAnyType([])).toBe(true)
    expect(isAnyType(parseAllowedTypes('any'))).toBe(true)
    expect(isAnyType(parseAllowedTypes('*'))).toBe(true)
    expect(isAnyType(parseAllowedTypes('authenticated'))).toBe(true)
    expect(isAnyType(parseAllowedTypes('admin,editor'))).toBe(false)
    expect(sessionAllowed(session, ['any'])).toBe(true)
    expect(sessionAllowed(session, ['admin'])).toBe(false)
    expect(sessionAllowed({ user_id: '1', user_type: 'admin' }, ['admin', 'editor'])).toBe(true)
    expect(sessionAllowed(undefined, ['any'])).toBe(false)
  })
})

describe('createAuth', () => {
  it('validates once when requireAuth and requireRole are stacked', async () => {
    let calls = 0
    const { requireAuth, requireRole } = createAuth(async () => {
      calls += 1
      return { user_id: '1', email: 'a@b.c', name: 'A', user_type: 'admin' }
    })
    const app = new Hono()
    app.get('/stacked', requireAuth(), requireRole('admin', 'editor'), (c) => c.json({ ok: true }))
    app.get('/role-only', requireRole('admin'), (c) => c.json({ ok: true }))
    app.get('/forbidden', requireRole('editor'), (c) => c.json({ ok: true }))

    const stacked = await app.request('/stacked', { headers: { 'X-Session-ID': 's' } })
    expect(stacked.status).toBe(200)
    expect(calls).toBe(1)

    const roleOnly = await app.request('/role-only', { headers: { 'X-Session-ID': 's' } })
    expect(roleOnly.status).toBe(200)
    expect(calls).toBe(2)

    const forbidden = await app.request('/forbidden', { headers: { 'X-Session-ID': 's' } })
    expect(forbidden.status).toBe(403)
    expect(calls).toBe(3)
  })

  it('maps requireAuth({ types }) to requireRole and 401s without a session', async () => {
    const { requireAuth } = createAuth(async () => ({ user_id: '1', user_type: 'user' }))
    const app = new Hono()
    app.get('/admin', requireAuth({ types: 'admin' }), (c) => c.json({ ok: true }))
    app.get('/any', requireAuth({ types: 'any' }), (c) => c.json({ ok: true }))

    expect((await app.request('/admin')).status).toBe(401)
    expect((await app.request('/admin', { headers: { 'X-Session-ID': 's' } })).status).toBe(403)
    expect((await app.request('/any', { headers: { 'X-Session-ID': 's' } })).status).toBe(200)
  })
})
