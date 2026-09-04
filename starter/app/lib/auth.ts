import type { Context, MiddlewareHandler, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getCookie } from 'hono/cookie'

export type SessionData = {
  user_id: string
  email: string
  name: string
  user_type?: string
  expires_at?: string
}

declare module 'hono' {
  interface ContextVariableMap {
    session: SessionData
    user_id: string
  }
}

function flowlessUrl(): string {
  // Server-only process env (not VITE_ / PUBFLOW_PUBLIC_).
  return (process.env.FLOWLESS_URL || process.env.FLOWLESS_API_URL || 'http://localhost:8787').replace(/\/$/, '')
}

function bridgeSecret(): string {
  return process.env.BRIDGE_VALIDATION_SECRET || process.env.BRIDGE_SECRET || ''
}

function extractSessionId(c: Context): string | null {
  return c.req.header('X-Session-ID') || c.req.query('session_id') || getCookie(c, 'session_id') || null
}

async function validateSession(sessionId: string): Promise<SessionData> {
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

export const requireAuth = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    const sessionId = extractSessionId(c)
    if (!sessionId) {
      throw new HTTPException(401, {
        message: 'Authentication required. Send X-Session-ID, session_id query, or session_id cookie.',
      })
    }
    const session = await validateSession(sessionId)
    c.set('session', session)
    c.set('user_id', session.user_id)
    await next()
  }
}
