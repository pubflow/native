/// <reference path="./virtual.d.ts" />
import type { Context, Next } from 'hono'
import { renderPage, type RouterFactory } from './ssr.tsx'

export type { RouterFactory }

/**
 * Hono handler that SSR-renders TanStack Router pages.
 * Used by the generated server and by custom `app/server.ts`.
 */
export function createPageHandler(getRouter: RouterFactory, indexHtml = '') {
  return async (c: Context) => renderPage(c, getRouter, indexHtml)
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
