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

  it('collapses index.ts to the folder mount', async () => {
    const products = new Hono()
    products.get('/', (c) => c.json({ products: true }))
    const app = createApiApp({
      '/app/api/products/index.ts': { default: products },
    })
    const res = await app.request('/products')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ products: true })
  })

  it('prefers folder index over a leaf file at the same mount', async () => {
    const leaf = new Hono()
    leaf.get('/', (c) => c.json({ from: 'leaf' }))
    const folder = new Hono()
    folder.get('/', (c) => c.json({ from: 'folder' }))
    const app = createApiApp({
      '/app/api/products.ts': { default: leaf },
      '/app/api/products/index.ts': { default: folder },
    })
    expect(await (await app.request('/products')).json()).toEqual({ from: 'folder' })
  })

  it('does not mount underscore helpers', async () => {
    const hidden = new Hono()
    hidden.get('/', (c) => c.json({ hidden: true }))
    const visible = new Hono()
    visible.get('/', (c) => c.json({ ok: true }))
    const app = createApiApp({
      '/app/api/v1/_hidden.ts': { default: hidden },
      '/app/api/v1/products.ts': { default: visible },
    })
    expect((await app.request('/v1/_hidden')).status).toBe(404)
    expect(await (await app.request('/v1/products')).json()).toEqual({ ok: true })
  })

  it('applies nested folder middleware', async () => {
    const products = new Hono()
    products.get('/', (c) => c.json({ ok: true }))
    const app = createApiApp({
      '/app/api/products/_middleware.ts': {
        default: async (c, next) => {
          c.header('X-Products', '1')
          await next()
        },
      },
      '/app/api/products/index.ts': { default: products },
    })
    const res = await app.request('/products')
    expect(res.headers.get('X-Products')).toBe('1')
  })
})
