import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { createPageHandler, shouldSkipPages } from './pages.ts'

describe('shouldSkipPages', () => {
  it('skips API, health, openapi, and rpc', () => {
    expect(shouldSkipPages('/api/items')).toBe(true)
    expect(shouldSkipPages('/api')).toBe(true)
    expect(shouldSkipPages('/health')).toBe(true)
    expect(shouldSkipPages('/openapi.json')).toBe(true)
    expect(shouldSkipPages('/rpc/ping')).toBe(true)
    expect(shouldSkipPages('/items')).toBe(false)
    expect(shouldSkipPages('/')).toBe(false)
  })
})

describe('createPageHandler', () => {
  it('does not SSR /api/* — falls through instead of loading TanStack', async () => {
    const app = new Hono()
    app.all(
      '*',
      createPageHandler(() => {
        throw new Error('pages must not SSR /api')
      }),
    )
    const res = await app.request('/api/items')
    expect(res.status).toBe(404)
  })
})
