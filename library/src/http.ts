import type { Context, MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'

export const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const
export const CORS_HEADERS = ['Content-Type', 'Authorization', 'X-Session-ID'] as const

const PLATFORM_IP_KEYS = ['CF_CONNECTING_IP', 'FLY_CLIENT_IP'] as const
const TRUSTED_IP_HEADERS = ['CF-Connecting-IP', 'True-Client-IP', 'Fly-Client-IP', 'X-Real-IP'] as const

export type ClientIpOptions = {
  trustProxy?: boolean
  platformIp?: string
}

function envFlag(name: string, fallback: boolean, env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env[name]
  if (raw == null || raw === '') return fallback
  const n = raw.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(n)) return true
  if (['false', '0', 'no', 'off'].includes(n)) return false
  return fallback
}

export function isProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  const node = (env.NODE_ENV || '').toLowerCase()
  return node === 'production'
}

/** Default: true in production, false locally. `TRUST_PROXY` overrides. */
export function isTrustProxy(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.TRUST_PROXY != null && env.TRUST_PROXY !== '') {
    return envFlag('TRUST_PROXY', isProduction(env), env)
  }
  return isProduction(env)
}

export function normalizeIp(value: string): string {
  const trimmed = value.trim().replace(/^["']|["']$/g, '')
  if (!trimmed || trimmed.toLowerCase() === 'unknown') return ''
  if (trimmed.startsWith('::ffff:')) return trimmed.slice(7)
  return trimmed
}

function firstHop(headerValue?: string | null): string {
  if (!headerValue) return ''
  return normalizeIp(headerValue.split(',')[0] || '')
}

function envRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return undefined
}

function platformIpFromEnv(c: Context, explicit?: string): string {
  if (explicit) return normalizeIp(explicit)
  const bag = envRecord(c.env)
  if (!bag) return ''
  for (const key of PLATFORM_IP_KEYS) {
    const value = bag[key]
    if (typeof value === 'string' && normalizeIp(value)) return normalizeIp(value)
  }
  return ''
}

/**
 * Client IP for rate-limit and session bind.
 * Untrusted forwarded headers are ignored unless TRUST_PROXY (or production) is on.
 * Platform IPs on `c.env` (Workers / Fly) are always used when present.
 */
export function getClientIp(c: Context, options: ClientIpOptions = {}): string {
  const platform = platformIpFromEnv(c, options.platformIp)
  if (platform) return platform

  const trust = options.trustProxy ?? isTrustProxy()
  if (!trust) return 'unknown'

  for (const header of TRUSTED_IP_HEADERS) {
    const ip = firstHop(c.req.header(header))
    if (ip) return ip
  }
  const forwarded = firstHop(c.req.header('X-Forwarded-For'))
  if (forwarded) return forwarded
  return 'unknown'
}

export function parseCorsOrigins(raw = process.env.CORS_ORIGINS || ''): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function devOrigins(): string[] {
  const port = process.env.PORT || '3000'
  return [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]
}

function requestHostOrigin(c: Context): string {
  const appUrl = (process.env.APP_URL || process.env.BASE_URL || '').replace(/\/$/, '')
  if (appUrl) return appUrl
  const host = c.req.header('host')
  if (!host) return ''
  const proto = c.req.header('x-forwarded-proto') || (isProduction() ? 'https' : 'http')
  return `${proto}://${host}`
}

export function resolveCorsOrigin(origin: string, c: Context): string | undefined {
  if (!origin) return undefined
  const configured = parseCorsOrigins()
  if (configured.includes('*')) return isProduction() ? undefined : origin
  if (configured.length) return configured.includes(origin) ? origin : undefined
  if (!isProduction()) return devOrigins().includes(origin) ? origin : undefined
  const same = requestHostOrigin(c)
  return same && origin === same ? origin : undefined
}

/** Instance CORS. Origins from `CORS_ORIGINS`; methods/headers are fixed. Never `*` in production. */
export function corsFromEnv(): MiddlewareHandler {
  return cors({
    origin: (origin, c) => resolveCorsOrigin(origin, c) || '',
    allowMethods: [...CORS_METHODS],
    allowHeaders: [...CORS_HEADERS],
    credentials: true,
    maxAge: 86400,
  })
}
