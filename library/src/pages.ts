/// <reference path="./virtual.d.ts" />
import type { Context, Next } from 'hono'
import { renderPage, type RouterFactory } from './ssr.tsx'

export type { RouterFactory }

/** Server paths that must never run TanStack SSR. */
export function shouldSkipPages(pathname: string): boolean {
  const path = (pathname.split('?')[0] || '/').replace(/\/+$/, '') || '/'
  if (path === '/health' || path === '/openapi.json') return true
  if (path === '/api' || path.startsWith('/api/')) return true
  if (path === '/rpc' || path.startsWith('/rpc/')) return true
  return false
}

/**
 * Hono handler that SSR-renders TanStack Router pages.
 * Used by the generated server and by custom `app/server.ts`.
 */
export function createPageHandler(getRouter: RouterFactory, indexHtml = '') {
  return async (c: Context, next: Next) => {
    if (shouldSkipPages(new URL(c.req.url).pathname)) {
      await next()
      return
    }
    return renderPage(c, getRouter, indexHtml)
  }
}

/**
 * Catch-all pages handler for `app/server.ts`.
 * HTML template comes from generated `virtual:pubflow-native/router` (`INDEX_HTML`).
 *
 * @example
 * import { pages } from '@pubflow/native/pages'
 * app.all('*', pages())
 */
export function pages(getRouter?: RouterFactory, indexHtml?: string) {
  return async (c: Context, next: Next) => {
    if (shouldSkipPages(new URL(c.req.url).pathname)) {
      await next()
      return
    }
    if (!getRouter) {
      try {
        const generated = await import('virtual:pubflow-native/router')
        return renderPage(c, generated.getRouter, indexHtml || generated.INDEX_HTML || '')
      } catch {
        await next()
        return
      }
    }
    return renderPage(c, getRouter, indexHtml || '')
  }
}
