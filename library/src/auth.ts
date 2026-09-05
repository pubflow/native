import type { Context, MiddlewareHandler, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getCookie } from 'hono/cookie'
import { isAnyType, parseAllowedTypes, sessionAllowed, type ActionSession } from './access.ts'

export type SessionData = ActionSession & {
  expires_at?: string
}

export type RequireAuthOptions = {
  /** @deprecated Prefer `requireRole('admin', 'editor')`. `any` / `authenticated` = any signed-in user. */
  types?: string | string[]
}

declare module 'hono' {
  interface ContextVariableMap {
    session: SessionData
    user_id: string
  }
}

function readSession(c: Context): SessionData | undefined {
  return (c as Context<{ Variables: { session?: SessionData } }>).get('session')
}

function extractSessionId(c: Context): string | null {
  return c.req.header('X-Session-ID') || c.req.query('session_id') || getCookie(c, 'session_id') || null
}

function flowlessUrl(): string {
  return (process.env.FLOWLESS_URL || process.env.FLOWLESS_API_URL || 'http://localhost:8787').replace(/\/$/, '')
}

function bridgeSecret(): string {
  return process.env.BRIDGE_VALIDATION_SECRET || process.env.BRIDGE_SECRET || ''
}

async function flowlessValidate(sessionId: string): Promise<SessionData> {
  const url = `${flowlessUrl()}/auth/bridge/validate?session_id=${encodeURIComponent(sessionId)}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const secret = bridgeSecret()
  if (secret) headers['X-Bridge-Secret'] = secret

  const response = await fetch(url, { method: 'POST', headers })
  if (!response.ok) {
    throw new HTTPException(401, { message: 'Invalid session' })
  }
  const data = (await response.json()) as {
    success?: boolean
    user?: { id: string; email: string; name?: string; user_type?: string; userType?: string }
    expires_at?: string
  }
  if (!data.success || !data.user) {
    throw new HTTPException(401, { message: 'Invalid session' })
  }
  return {
    user_id: data.user.id,
    email: data.user.email,
    name: data.user.name || '',
    user_type: data.user.user_type || data.user.userType,
    expires_at: data.expires_at,
  }
}

/**
 * Build `requireAuth` / `requireRole` with any session validator.
 * If `c.get('session')` is already set, Flowless (or your adapter) is not called again.
 */
export function createAuth(validateSession: (sessionId: string) => Promise<SessionData>) {
  async function loadSession(c: Context): Promise<SessionData> {
    const existing = readSession(c)
    if (existing) return existing
    const sessionId = extractSessionId(c)
    if (!sessionId) {
      throw new HTTPException(401, {
        message: 'Authentication required. Send X-Session-ID, session_id query, or session_id cookie.',
      })
    }
    const session = await validateSession(sessionId)
    c.set('session', session)
    c.set('user_id', session.user_id)
    return session
  }

  function requireRole(...roles: string[]): MiddlewareHandler {
    const types = parseAllowedTypes(roles)
    return async (c: Context, next: Next) => {
      const session = await loadSession(c)
      if (!sessionAllowed(session, types.length ? types : ['any'])) {
        throw new HTTPException(403, { message: 'Forbidden' })
      }
      await next()
    }
  }

  function requireAuth(options: RequireAuthOptions = {}): MiddlewareHandler {
    const types = parseAllowedTypes(options.types)
    if (types.length && !isAnyType(types)) return requireRole(...types)
    return async (c: Context, next: Next) => {
      await loadSession(c)
      await next()
    }
  }

  return { requireAuth, requireRole, loadSession }
}

const flowless = createAuth(flowlessValidate)

/** Any signed-in user. Skips the validator when session is already on the context. */
export const requireAuth = flowless.requireAuth

/** Session + `user_type`. One validator call even if stacked after `requireAuth()`. */
export const requireRole = flowless.requireRole
