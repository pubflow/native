import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { apiRelFromGlobKey, parseApiRel, preferFolderMounts } from './api-path.ts'

type ApiModule = {
  default?: unknown
}

function isHonoApp(value: unknown): value is Hono {
  return Boolean(value && typeof value === 'object' && 'fetch' in (value as object) && 'route' in (value as object))
}

function isMiddleware(value: unknown): value is MiddlewareHandler {
  return typeof value === 'function'
}

/**
 * Build a Hono app from Vite `import.meta.glob` of `app/api/**`.
 * `_middleware.ts` wraps `/api/*` (or a folder prefix). Each other default export is mounted
 * at `/api/<relative-path>` (`index.ts` collapses to the folder). Files/folders starting with
 * `_` (except `_middleware`) are skipped. If a leaf file and a folder `index` share a mount,
 * the folder wins.
 */
export function createApiApp(modules: Record<string, ApiModule>): Hono {
  const api = new Hono()
  const middleware: Array<{ mount: string; handler: MiddlewareHandler }> = []
  const routes: Array<{ mount: string; app: Hono; rank: number; key: string }> = []

  for (const [key, mod] of Object.entries(modules)) {
    const parsed = parseApiRel(apiRelFromGlobKey(key))
    if (parsed.skip) continue
    const exported = mod?.default
    if (parsed.isMiddleware) {
      if (isMiddleware(exported)) middleware.push({ mount: parsed.mount, handler: exported })
      continue
    }
    if (isHonoApp(exported)) {
      routes.push({ mount: parsed.mount, app: exported, rank: parsed.rank, key })
    }
  }

  const kept = preferFolderMounts(routes, (dropped, keptRoute) => {
    console.warn(
      `[pubflow-native] ${dropped.key} ignored; folder already defines /api${keptRoute.mount === '/' ? '' : keptRoute.mount}`,
    )
  })

  const rootMw = middleware.filter((item) => item.mount === '/' || item.mount === '')
  for (const item of rootMw) api.use('*', item.handler)
  for (const item of middleware) {
    if (item.mount && item.mount !== '/') {
      api.use(`${item.mount}/*`, item.handler)
    }
  }
  for (const route of kept) {
    api.route(route.mount === '/' ? '/' : route.mount, route.app)
  }
  return api
}

/**
 * For `app/server.ts`: mount every file in `app/api` the same way the generated handler does.
 * Relies on the Vite glob written into `.pubflow/generated/server.ts` when you do not
 * use a custom server. Custom servers should glob themselves or import route modules.
 */
export function apiFromDir(modules?: Record<string, ApiModule>): Hono {
  if (!modules) {
    throw new Error(
      'apiFromDir() needs the Vite glob of app/api files. In app/server.ts use:\n' +
        "  import { apiFromDir } from '@pubflow/native/api'\n" +
        "  const modules = import.meta.glob('./api/**/*.{ts,js}', { eager: true })\n" +
        '  app.route(\'/api\', apiFromDir(modules))',
    )
  }
  return createApiApp(modules)
}
