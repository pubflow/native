import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getHybridCache, type HybridCache } from './cache.ts'
import { getClientIp } from './http.ts'

export type ValidationMode = 'DISABLED' | 'STANDARD' | 'ADVANCED' | 'STRICT'

export type SessionBind = {
  ip: string
  userAgent: string
  device: string
}

export type SessionSecurityConfig = {
  mode: ValidationMode
  enabled: boolean
  ip: boolean
  userAgent: boolean
  device: boolean
  autoInvalidate: boolean
  logViolations: boolean
}

function envFlag(name: string, fallback: boolean, env: NodeJS.ProcessEnv): boolean {
  const raw = env[name]
  if (raw == null || raw === '') return fallback
  const n = raw.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(n)) return true
  if (['false', '0', 'no', 'off'].includes(n)) return false
  return fallback
}

function parseMode(raw?: string): ValidationMode {
  const value = (raw || 'STANDARD').trim().toUpperCase()
  if (value === 'DISABLED' || value === 'STANDARD' || value === 'ADVANCED' || value === 'STRICT') return value
  return 'STANDARD'
}

function defaultsForMode(mode: ValidationMode) {
  if (mode === 'DISABLED') return { ip: false, userAgent: false, device: false }
  if (mode === 'STANDARD') return { ip: true, userAgent: false, device: false }
  return { ip: true, userAgent: true, device: false }
}

export function readSessionSecurityConfig(env: NodeJS.ProcessEnv = process.env): SessionSecurityConfig {
  const mode = parseMode(env.AUTH_VALIDATION_MODE)
  const preset = defaultsForMode(mode)
  return {
    mode,
    enabled: envFlag('AUTH_ENABLE_VALIDATION_MODE', mode !== 'DISABLED', env),
    ip: envFlag('AUTH_IP_VALIDATION', preset.ip, env),
    userAgent: envFlag('AUTH_USER_AGENT_VALIDATION', preset.userAgent, env),
    device: envFlag('AUTH_DEVICE_VALIDATION', preset.device, env),
    autoInvalidate: envFlag('AUTH_AUTO_INVALIDATE', false, env),
    logViolations: envFlag('AUTH_LOG_VIOLATIONS', true, env),
  }
}

export function requestBind(c: Context): SessionBind {
  return {
    ip: getClientIp(c),
    userAgent: c.req.header('user-agent') || 'unknown',
    device: c.req.header('sec-ch-ua') || 'unknown',
  }
}

function bindKey(sessionId: string) {
  return `session-bind:${sessionId}`
}

export type SessionViolation = {
  type: 'IP_MISMATCH' | 'USER_AGENT_MISMATCH' | 'DEVICE_MISMATCH'
  expected: string
  actual: string
}

export function compareBind(stored: SessionBind, current: SessionBind, config: SessionSecurityConfig): SessionViolation[] {
  const violations: SessionViolation[] = []
  if (config.ip && stored.ip && current.ip && stored.ip !== current.ip && stored.ip !== 'unknown' && current.ip !== 'unknown') {
    violations.push({ type: 'IP_MISMATCH', expected: stored.ip, actual: current.ip })
  }
  if (config.userAgent && stored.userAgent && current.userAgent && stored.userAgent !== current.userAgent) {
    violations.push({ type: 'USER_AGENT_MISMATCH', expected: stored.userAgent, actual: current.userAgent })
  }
  if (config.device && stored.device && current.device && stored.device !== 'unknown' && current.device !== 'unknown' && stored.device !== current.device) {
    violations.push({ type: 'DEVICE_MISMATCH', expected: stored.device, actual: current.device })
  }
  return violations
}

function logViolations(sessionId: string, violations: SessionViolation[], config: SessionSecurityConfig) {
  if (!config.logViolations || !violations.length) return
  console.warn(
    `[pubflow-native] session ${sessionId.slice(0, 8)}… ${violations.map((v) => `${v.type} expected=${v.expected} actual=${v.actual}`).join('; ')}`,
  )
}

export type FlowlessLogout = (sessionId: string) => Promise<void>

export type ApplySessionSecurityOptions = {
  config?: SessionSecurityConfig
  cache?: HybridCache
  logout?: FlowlessLogout
}

/**
 * Bind IP/UA on first Native request for this session, then compare.
 * STANDARD/ADVANCED log and allow. STRICT returns 401.
 * STRICT + AUTH_AUTO_INVALIDATE posts Flowless /auth/logout (real session kill).
 */
export async function applySessionSecurity(
  c: Context,
  sessionId: string,
  options: ApplySessionSecurityOptions = {},
): Promise<void> {
  const config = options.config || readSessionSecurityConfig()
  if (!config.enabled || config.mode === 'DISABLED') return

  const cache = options.cache || getHybridCache()
  const current = requestBind(c)
  const raw = await cache.get(bindKey(sessionId))
  if (!raw) {
    await cache.set(bindKey(sessionId), JSON.stringify(current), 600)
    return
  }

  let stored: SessionBind
  try {
    stored = JSON.parse(raw) as SessionBind
  } catch {
    await cache.set(bindKey(sessionId), JSON.stringify(current), 600)
    return
  }

  const violations = compareBind(stored, current, config)
  if (!violations.length) return

  logViolations(sessionId, violations, config)

  if (config.mode !== 'STRICT') return

  await cache.del(bindKey(sessionId))
  if (config.autoInvalidate && options.logout) {
    try {
      await options.logout(sessionId)
    } catch (error) {
      console.warn('[pubflow-native] Flowless logout after session violation failed:', error)
    }
  }
  throw new HTTPException(401, {
    message: `Session validation failed: ${violations.map((v) => v.type).join(', ')}`,
  })
}
