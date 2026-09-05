import type { Context, MiddlewareHandler } from 'hono'
import { getHybridCache, type HybridCache } from './cache.ts'
import { getClientIp } from './http.ts'

export type RateLimitOptions = {
  max: number
  windowSeconds: number
  /** Default `ip`. `session` uses X-Session-ID when present, else IP. */
  key?: 'ip' | 'session'
  prefix?: string
  cache?: HybridCache
}

export const rateLimitPresets = {
  login: { max: 5, windowSeconds: 15 * 60 },
  api: { max: 120, windowSeconds: 60 },
} as const

function requestKey(c: Context, kind: 'ip' | 'session'): string {
  if (kind === 'session') {
    const session = c.req.header('X-Session-ID') || c.req.query('session_id')
    if (session) return `session:${session}`
  }
  return `ip:${getClientIp(c)}`
}

export async function consumeRateLimit(
  bucket: string,
  options: RateLimitOptions,
): Promise<{ ok: boolean; remaining: number; resetSeconds: number }> {
  const cache = options.cache || getHybridCache()
  const windowSeconds = Math.max(1, options.windowSeconds)
  const raw = await cache.get(bucket)
  const now = Math.floor(Date.now() / 1000)
  let count = 0
  let reset = now + windowSeconds
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { count?: number; reset?: number }
      if (typeof parsed.reset === 'number' && parsed.reset > now) {
        count = Number(parsed.count) || 0
        reset = parsed.reset
      }
    } catch {
      count = 0
    }
  }
  if (count >= options.max) {
    return { ok: false, remaining: 0, resetSeconds: Math.max(1, reset - now) }
  }
  count += 1
  await cache.set(bucket, JSON.stringify({ count, reset }), reset - now)
  return { ok: true, remaining: Math.max(0, options.max - count), resetSeconds: reset - now }
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const prefix = options.prefix || 'rl'
  return async (c, next) => {
    const id = requestKey(c, options.key || 'ip')
    const result = await consumeRateLimit(`${prefix}:${id}`, options)
    c.header('X-RateLimit-Limit', String(options.max))
    c.header('X-RateLimit-Remaining', String(result.remaining))
    c.header('X-RateLimit-Reset', String(result.resetSeconds))
    if (!result.ok) {
      return c.json({ error: 'Too many requests' }, 429)
    }
    await next()
  }
}
