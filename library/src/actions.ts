import { Hono } from 'hono'
import type { Context, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { actionId, isAnyType, parseAllowedTypes, sessionAllowed, type ActionSession } from './access.ts'

export type { ActionSession } from './access.ts'
export { isAnyType, parseAllowedTypes, sessionAllowed, actionId, toPosix } from './access.ts'

const SKIP_EXPORTS = new Set(['auth', 'allowedTypes', 'default', 'middleware', 'requireAuth', 'requireRole'])

export type ActionContext = {
  c: Context
  session?: ActionSession
}

export type ActionModule = {
  auth?: boolean | 'required'
  allowedTypes?: string | string[]
  requireAuth?: (options?: { types?: string | string[] }) => MiddlewareHandler
  requireRole?: (...roles: string[]) => MiddlewareHandler
  default?: unknown
  [name: string]: unknown
}

function normalizeKey(key: string): string {
  return key.replace(/\\/g, '/')
}

function relFromGlobKey(key: string): string {
  const posix = normalizeKey(key).replace(/^\.\//, '')
  for (const marker of ['/app/actions/', '/actions/']) {
    const idx = posix.lastIndexOf(marker)
    if (idx >= 0) return posix.slice(idx + marker.length)
  }
  if (posix.startsWith('actions/')) return posix.slice('actions/'.length)
  return posix.replace(/^\.\//, '')
}

function isMiddlewareHandler(value: unknown): value is MiddlewareHandler {
  return typeof value === 'function'
}

function actionFns(mod: ActionModule): Array<{ name: string; fn: (...args: unknown[]) => unknown }> {
  const out: Array<{ name: string; fn: (...args: unknown[]) => unknown }> = []
  for (const [name, value] of Object.entries(mod)) {
    if (SKIP_EXPORTS.has(name) || typeof value !== 'function') continue
    out.push({ name, fn: value as (...args: unknown[]) => unknown })
  }
  return out
}

function wantsAuth(mod: ActionModule, types: string[]): boolean {
  return Boolean(mod.auth === true || mod.auth === 'required' || types.length)
}

function readSession(c: Context): ActionSession | undefined {
  return (c as Context<{ Variables: { session?: ActionSession } }>).get('session')
}

async function runMiddleware(handler: MiddlewareHandler, c: Context): Promise<void> {
  await handler(c, async () => undefined)
}

function appliesToAction(prefix: string, id: string): boolean {
  if (!prefix) return true
  return id === prefix || id.startsWith(`${prefix}.`)
}

/**
 * Hono app mounted at `/api/actions`. Each exported function becomes
 * `POST /<id>` where id is `posts.createPost` (path + export).
 */
export function createActionsApp(modules: Record<string, ActionModule>): Hono {
  const app = new Hono()
  const entries = Object.entries(modules).map(([key, mod]) => ({
    key,
    rel: relFromGlobKey(key),
    mod: (mod || {}) as ActionModule,
  }))

  const rootAuth = entries.find((item) => item.rel.replace(/\.(ts|js)$/, '') === '_auth')
  const authenticate = rootAuth?.mod.requireAuth

  const middleware: Array<{ prefix: string; handler: MiddlewareHandler }> = []
  for (const item of entries) {
    const base = item.rel.replace(/\.(ts|js)$/, '')
    const parts = base.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last !== '_middleware') continue
    const handler = isMiddlewareHandler(item.mod.default) ? item.mod.default : null
    if (!handler) continue
    middleware.push({ prefix: parts.slice(0, -1).join('.'), handler })
  }

  const handlers = new Map<
    string,
    { mod: ActionModule; fn: (...args: unknown[]) => unknown; rel: string }
  >()

  for (const item of entries) {
    const base = item.rel.replace(/\.(ts|js)$/, '')
    const last = base.split('/').pop()
    if (last === '_middleware' || last === '_auth') continue
    for (const { name, fn } of actionFns(item.mod)) {
      handlers.set(actionId(item.rel, name), { mod: item.mod, fn, rel: item.rel })
    }
  }

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ message: err.message, error: err.message }, err.status)
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return c.json({ message, error: message }, 500)
  })

  app.post('/:id', async (c) => {
    const id = decodeURIComponent(c.req.param('id'))
    const found = handlers.get(id)
    if (!found) throw new HTTPException(404, { message: `Unknown action ${id}` })

    const types = parseAllowedTypes(found.mod.allowedTypes)

    for (const item of middleware) {
      if (appliesToAction(item.prefix, id)) await runMiddleware(item.handler, c)
    }

    if (wantsAuth(found.mod, types)) {
      if (authenticate) {
        await runMiddleware(authenticate({ types: isAnyType(types) ? 'any' : types }), c)
      } else {
        const session = readSession(c)
        if (!session) {
          throw new HTTPException(401, {
            message:
              'Authentication required. Add app/actions/_auth.ts that exports requireAuth, or send a session.',
          })
        }
        if (!sessionAllowed(session, types.length ? types : ['any'])) {
          throw new HTTPException(403, { message: 'Forbidden' })
        }
      }
    }

    let args: unknown[] = []
    try {
      const body = (await c.req.json()) as { args?: unknown }
      if (Array.isArray(body?.args)) args = body.args
      else if (body?.args !== undefined) args = [body.args]
    } catch {
      args = []
    }

    const session = readSession(c)
    const result = await found.fn(...args, { c, session } satisfies ActionContext)
    return c.json({ result })
  })

  return app
}

/** Same as `createActionsApp` — for `app/server.ts` next to `apiFromDir`. */
export function actionsFromDir(modules: Record<string, ActionModule>): Hono {
  return createActionsApp(modules)
}

const FN_EXPORT =
  /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|export\s+const\s+([A-Za-z_$][\w$]*)\s*=/g

export function listExportedFunctions(source: string): string[] {
  const names: string[] = []
  for (const match of source.matchAll(FN_EXPORT)) {
    const name = match[1] || match[2]
    if (name && !SKIP_EXPORTS.has(name)) names.push(name)
  }
  return [...new Set(names)]
}

export function emitActionStub(rel: string, exportNames: string[]): string {
  const lines = [
    `function sessionId() {`,
    `  if (typeof window === 'undefined') return ''`,
    `  try {`,
    `    return localStorage.getItem('pubflow_session_id') || localStorage.getItem('session_id') || ''`,
    `  } catch {`,
    `    return ''`,
    `  }`,
    `}`,
    ``,
    `async function callAction(id, args) {`,
    `  const headers = { 'Content-Type': 'application/json' }`,
    `  const sid = sessionId()`,
    `  if (sid) headers['X-Session-ID'] = sid`,
    `  const res = await fetch('/api/actions/' + id, {`,
    `    method: 'POST',`,
    `    headers,`,
    `    credentials: 'include',`,
    `    body: JSON.stringify({ args }),`,
    `  })`,
    `  const data = await res.json().catch(() => ({}))`,
    `  if (!res.ok) throw new Error(data.message || data.error || res.statusText)`,
    `  return data.result`,
    `}`,
    ``,
  ]
  for (const name of exportNames) {
    const id = actionId(rel, name)
    lines.push(`export async function ${name}(...args) { return callAction(${JSON.stringify(id)}, args) }`)
  }
  if (!exportNames.length) lines.push(`export {}`)
  return lines.join('\n') + '\n'
}
