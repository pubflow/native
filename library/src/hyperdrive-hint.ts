import fs from 'node:fs'
import path from 'node:path'

export const HYPERDRIVE_GUIDE_URL = 'https://github.com/pubflow/native/blob/master/docs/hyperdrive.md'

export const HYPERDRIVE_HINT = `[pubflow-native] Postgres/MySQL on a Worker opens TCP from every isolate — extra connections and CPU (free tier is 10 ms CPU per request). Use Cloudflare Hyperdrive (edge pool). Turso (libsql://) does not need this.

  Dashboard: https://dash.cloudflare.com → Storage & databases → Hyperdrive → Create
  or: npx wrangler hyperdrive create native-db --connection-string="postgres://..."

  Then uncomment hyperdrive in wrangler.jsonc and paste the id.
  Guide: ${HYPERDRIVE_GUIDE_URL}`

const WRANGLER_NAMES = ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml'] as const

const TCP_PROVIDERS = new Set([
  'postgres',
  'postgresql',
  'mysql',
  'neon',
  'neon-http',
  'planetscale',
])

function stripComments(source: string): string {
  let out = ''
  let i = 0
  let inString = false
  let quote = ''
  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]
    if (inString) {
      out += char
      if (char === '\\') {
        out += next ?? ''
        i += 2
        continue
      }
      if (char === quote) inString = false
      i += 1
      continue
    }
    if (char === '"' || char === "'") {
      inString = true
      quote = char
      out += char
      i += 1
      continue
    }
    if (char === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1
      continue
    }
    if (char === '/' && next === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1
      i += 2
      continue
    }
    if (char === '#') {
      while (i < source.length && source[i] !== '\n') i += 1
      continue
    }
    out += char
    i += 1
  }
  return out
}

function isPlaceholderId(id: string): boolean {
  const value = id.trim()
  if (!value) return true
  if (value.startsWith('<') && value.endsWith('>')) return true
  return false
}

export function isTcpDatabaseUrl(url: string, providerOverride = ''): boolean {
  const explicit = providerOverride.trim().toLowerCase()
  if (explicit === 'libsql' || explicit === 'turso') return false
  const lower = url.trim().toLowerCase()
  if (lower.startsWith('libsql://') || lower.startsWith('file:')) return false
  if (TCP_PROVIDERS.has(explicit)) return Boolean(lower)
  if (!lower) return false
  return (
    lower.startsWith('postgres://') ||
    lower.startsWith('postgresql://') ||
    lower.startsWith('mysql://')
  )
}

export function wranglerHasHyperdriveBinding(source: string): boolean {
  const text = stripComments(source)
  const jsonMatch = text.match(/"hyperdrive"\s*:\s*\[[\s\S]*?"id"\s*:\s*"([^"]*)"/i)
  if (jsonMatch?.[1] && !isPlaceholderId(jsonMatch[1])) return true
  const tomlMatch = text.match(/\[\[hyperdrive\]\][\s\S]*?\bid\s*=\s*"([^"]*)"/i)
  if (tomlMatch?.[1] && !isPlaceholderId(tomlMatch[1])) return true
  return false
}

export function wranglerConfigSource(root: string): string | null {
  for (const name of WRANGLER_NAMES) {
    const file = path.join(root, name)
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8')
  }
  return null
}

export function shouldWarnHyperdrive(input: {
  isSsrBuild: boolean
  wranglerSource: string | null
  databaseUrl: string
  databaseProvider?: string
}): boolean {
  if (!input.isSsrBuild) return false
  if (input.wranglerSource == null) return false
  if (!isTcpDatabaseUrl(input.databaseUrl, input.databaseProvider || '')) return false
  if (wranglerHasHyperdriveBinding(input.wranglerSource)) return false
  return true
}

export function databaseUrlFromEnv(env: Record<string, string | undefined>): string {
  return (
    env.DATABASE_URL?.trim() ||
    env.NEON_DATABASE_URL?.trim() ||
    env.PLANETSCALE_DATABASE_URL?.trim() ||
    ''
  )
}
