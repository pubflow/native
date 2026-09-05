import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { HTTPException } from 'hono/http-exception'
import {
  actionId,
  createActionsApp,
  emitActionStub,
  listExportedFunctions,
  parseAllowedTypes,
  sessionAllowed,
} from './actions.ts'
import type { ActionSession } from './actions.ts'

function authModule(session?: ActionSession) {
  return {
    requireAuth:
      (options?: { types?: string | string[] }) =>
      async (c: { req: { header: (name: string) => string | undefined }; set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
        const types = parseAllowedTypes(options?.types)
        if (!c.req.header('X-Session-ID')) {
          throw new HTTPException(401, { message: 'Authentication required' })
        }
        if (!session) throw new HTTPException(401, { message: 'Invalid session' })
        c.set('session', session)
        if (!sessionAllowed(session, types.length ? types : ['any'])) {
          throw new HTTPException(403, { message: 'Forbidden' })
        }
        await next()
      },
  }
}

describe('actionId', () => {
  it('does not pull node:fs into the actions runtime module', () => {
    const source = fs.readFileSync(path.join(import.meta.dir, 'actions.ts'), 'utf8')
    expect(source).not.toContain('node:fs')
    expect(source).not.toContain("./scan.ts")
  })

  it('uses dir + export when the file is named after the function', () => {
    expect(actionId('posts/createPost.ts', 'createPost')).toBe('posts.createPost')
    expect(actionId('ping.ts', 'ping')).toBe('ping')
  })

  it('keeps the file segment when it differs from the export', () => {
    expect(actionId('posts/index.ts', 'createPost')).toBe('posts.index.createPost')
  })
})

describe('parseAllowedTypes', () => {
  it('splits comma lists and lowercases', () => {
    expect(parseAllowedTypes('Admin, Editor')).toEqual(['admin', 'editor'])
    expect(parseAllowedTypes(['authenticated'])).toEqual(['authenticated'])
    expect(parseAllowedTypes('any')).toEqual(['any'])
    expect(parseAllowedTypes()).toEqual([])
  })
})

describe('listExportedFunctions / emitActionStub', () => {
  it('skips auth flags and emits a POST stub', () => {
    const source = `
export const auth = true
export const allowedTypes = 'admin'
export async function createPost(input) { return input }
export const other = async () => 1
`
    expect(listExportedFunctions(source)).toEqual(['createPost', 'other'])
    const stub = emitActionStub('posts/createPost.ts', ['createPost'])
    expect(stub).toContain("callAction(\"posts.createPost\"")
    expect(stub).toContain("fetch('/api/actions/' + id")
    expect(stub).toContain('X-Session-ID')
    expect(stub).not.toContain('DATABASE_URL')
  })
})

describe('createActionsApp', () => {
  it('invokes a public action and folder middleware', async () => {
    const app = createActionsApp({
      '/app/actions/posts/_middleware.ts': {
        default: async (c: { header: (name: string, value: string) => void }, next: () => Promise<void>) => {
          c.header('X-Action-Mw', '1')
          await next()
        },
      },
      '/app/actions/posts/createPost.ts': {
        createPost: async (input: { title: string }) => ({ title: input.title }),
      },
      '/app/actions/ping.ts': {
        ping: async () => 'pong',
      },
    })

    const ping = await app.request('/ping', { method: 'POST', body: JSON.stringify({ args: [] }) })
    expect(ping.status).toBe(200)
    expect(await ping.json()).toEqual({ result: 'pong' })

    const created = await app.request('/posts.createPost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [{ title: 'hi' }] }),
    })
    expect(created.status).toBe(200)
    expect(created.headers.get('X-Action-Mw')).toBe('1')
    expect(await created.json()).toEqual({ result: { title: 'hi' } })
  })

  it('returns 401 without a session and 403 on user_type mismatch', async () => {
    const user: ActionSession = { user_id: '1', email: 'a@b.c', name: 'A', user_type: 'user' }
    const app = createActionsApp({
      '/app/actions/_auth.ts': authModule(user),
      '/app/actions/secret.ts': {
        auth: true,
        allowedTypes: 'admin,editor',
        secret: async () => 'nope',
      },
      '/app/actions/me.ts': {
        auth: true,
        me: async (ctx: { session?: ActionSession }) => ctx.session,
      },
      '/app/actions/open.ts': {
        allowedTypes: 'any',
        open: async () => 'open',
      },
    })

    const anon = await app.request('/secret', { method: 'POST', body: JSON.stringify({ args: [] }) })
    expect(anon.status).toBe(401)

    const forbidden = await app.request('/secret', {
      method: 'POST',
      headers: { 'X-Session-ID': 'sess' },
      body: JSON.stringify({ args: [] }),
    })
    expect(forbidden.status).toBe(403)

    const me = await app.request('/me', {
      method: 'POST',
      headers: { 'X-Session-ID': 'sess' },
      body: JSON.stringify({ args: [] }),
    })
    expect(me.status).toBe(200)
    expect((await me.json()).result).toEqual(user)

    const anonOpen = await app.request('/open', { method: 'POST', body: JSON.stringify({ args: [] }) })
    expect(anonOpen.status).toBe(401)

    const open = await app.request('/open', {
      method: 'POST',
      headers: { 'X-Session-ID': 'sess' },
      body: JSON.stringify({ args: [] }),
    })
    expect(open.status).toBe(200)
  })

  it('resolves Vite glob keys relative to app/server.ts', async () => {
    const app = createActionsApp({
      './actions/ping.ts': {
        ping: async () => 'pong',
      },
    })
    const res = await app.request('/ping', { method: 'POST', body: JSON.stringify({ args: [] }) })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ result: 'pong' })
  })

  it('returns 401 when auth is required and _auth.ts is missing', async () => {
    const app = createActionsApp({
      '/app/actions/locked.ts': {
        auth: true,
        locked: async () => 'x',
      },
    })
    const res = await app.request('/locked', { method: 'POST', body: JSON.stringify({ args: [] }) })
    expect(res.status).toBe(401)
  })
})
