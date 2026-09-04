import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { createApiApp } from './api.ts'

describe('createApiApp', () => {
  it('mounts globbed Hono apps and applies root middleware', async () => {
    const hello = new Hono()
    hello.get('/', (c) => c.json({ hello: 'ok' }))
    const users = new Hono()
    users.get('/', (c) => c.json({ users: true }))

    const app = createApiApp({
      '/app/api/_middleware.ts': {
        default: async (c, next) => {
          c.header('X-Mw', '1')
          await next()
        },
      },
      '/app/api/hello.ts': { default: hello },
      '/app/api/users.ts': { default: users },
    })

    const helloRes = await app.request('/hello')
    expect(helloRes.status).toBe(200)
    expect(helloRes.headers.get('X-Mw')).toBe('1')
    expect(await helloRes.json()).toEqual({ hello: 'ok' })

    const usersRes = await app.request('/users')
    expect(usersRes.status).toBe(200)
    expect(await usersRes.json()).toEqual({ users: true })
  })
})
