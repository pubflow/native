import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

type ApiModule = {
  default?: unknown
}

function normalizeKey(key: string): string {
  return key.replace(/\\/g, '/')
}

function mountFromGlobKey(key: string): { mount: string; isMiddleware: boolean } {
  const posix = normalizeKey(key)
  const marker = '/app/api/'
  const idx = posix.lastIndexOf(marker)
  const rel = (idx >= 0 ? posix.slice(idx + marker.length) : posix.split('/app/api/').pop() || posix)
    .replace(/\.(ts|js)$/, '')
  const parts = rel.split('/').filter(Boolean)
  const last = parts[parts.length - 1]
  if (last === '_middleware') {
    return { mount: '/' + parts.slice(0, -1).join('/'), isMiddleware: true }
  }
  return { mount: '/' + parts.join('/'), isMiddleware: false }
}

function isHonoApp(value: unknown): value is Hono {
  return Boolean(value && typeof value === 'object' && 'fetch' in (value as object) && 'route' in (value as object))
}

function isMiddleware(value: unknown): value is MiddlewareHandler {
  return typeof value === 'function'
}

/**
 * Build a Hono app from Vite `import.meta.glob` of `app/api/**`.
 * `_middleware.ts` wraps every `/api/*` route. Each other default export is mounted
 * at `/api/<relative-path>` (without the `/api` prefix on this sub-app).
 */
export function createApiApp(modules: Record<string, ApiModule>): Hono {
  const api = new Hono()
  const middleware: Array<{ mount: string; handler: MiddlewareHandler }> = []
  const routes: Array<{ mount: string; app: Hono }> = []

  for (const [key, mod] of Object.entries(modules)) {
    const { mount, isMiddleware: mw } = mountFromGlobKey(key)
    const exported = mod?.default
    if (mw) {
      if (isMiddleware(exported)) middleware.push({ mount, handler: exported })
      continue
    }
    if (isHonoApp(exported)) {
      routes.push({ mount, app: exported })
    }
  }

  const rootMw = middleware.filter((item) => item.mount === '/' || item.mount === '')
  for (const item of rootMw) api.use('*', item.handler)
  for (const item of middleware) {
    if (item.mount && item.mount !== '/') {
      api.use(`${item.mount}/*`, item.handler)
    }
  }
  for (const route of routes) {
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
