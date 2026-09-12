type EnvMap = Record<string, string | undefined>

declare global {
  interface Window {
    __PUBFLOW_PUBLIC__?: Record<string, string>
  }
}

export const PUBLIC_BOOT_KEYS = ['FLOWLESS_URL', 'BRIDGE_SECRET'] as const

const PUBLIC_BOOT_ALIASES: Record<(typeof PUBLIC_BOOT_KEYS)[number], readonly string[]> = {
  FLOWLESS_URL: ['FLOWLESS_URL', 'FLOWLESS_API_URL', 'PUBFLOW_PUBLIC_FLOWLESS_URL', 'VITE_FLOWLESS_URL'],
  BRIDGE_SECRET: [
    'BRIDGE_SECRET',
    'BRIDGE_VALIDATION_SECRET',
    'PUBFLOW_PUBLIC_BRIDGE_SECRET',
    'VITE_BRIDGE_SECRET',
  ],
}

function readViteEnv(): EnvMap {
  return import.meta.env as unknown as EnvMap
}

function readProcessEnv(): EnvMap {
  if (typeof process === 'undefined' || !process.env) return {}
  return process.env
}

function firstDefined(env: EnvMap, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function readKey(env: unknown, key: string): string | undefined {
  if (!env || typeof env !== 'object') return undefined
  const value = (env as EnvMap)[key]
  if (typeof value === 'string' && value.trim()) return value.trim()
  return undefined
}

/** Direct key access only — Worker secrets are not enumerable. */
export function mergeContextEnv(contextEnv?: unknown): EnvMap {
  const merged: EnvMap = { ...readProcessEnv() }
  for (const aliases of Object.values(PUBLIC_BOOT_ALIASES)) {
    for (const key of aliases) {
      const value = readKey(contextEnv, key)
      if (value) merged[key] = value
    }
  }
  return merged
}

/**
 * Client env. Reads `PUBFLOW_PUBLIC_<name>` then `VITE_<name>`.
 * Server secrets must stay unprefixed (`DATABASE_URL`) so Vite never inlines them.
 */
export function publicEnv(name: string, env: EnvMap = readViteEnv()): string | undefined {
  return firstDefined(env, [`PUBFLOW_PUBLIC_${name}`, `VITE_${name}`])
}

/**
 * Server env. Unprefixed name wins, then the public/Vite copies of the same key.
 * So `PUBFLOW_PUBLIC_FLOWLESS_URL` is enough; `FLOWLESS_URL` is an optional override.
 */
export function serverEnv(name: string, env: EnvMap = readProcessEnv()): string | undefined {
  return firstDefined(env, [name, `PUBFLOW_PUBLIC_${name}`, `VITE_${name}`])
}

function isLocalFlowless(value: string) {
  try {
    const host = new URL(value).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}

/** Public Flowless URL + bridge string for the HTML boot script. Never includes `DATABASE_URL`. */
export function publicBootPayload(env: EnvMap): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const name of PUBLIC_BOOT_KEYS) {
    let value = firstDefined(env, PUBLIC_BOOT_ALIASES[name])
    if (value && name === 'FLOWLESS_URL' && isLocalFlowless(value)) {
      const published = firstDefined(env, ['PUBFLOW_PUBLIC_FLOWLESS_URL', 'VITE_FLOWLESS_URL'])
      if (published && !isLocalFlowless(published)) value = published
    }
    if (value) payload[name] = value
  }
  return payload
}

/** Copy Worker/runtime public Flowless keys onto `process.env` for SSR (`bootEnv` / `serverEnv`). */
export function hydratePublicBootProcess(contextEnv?: unknown) {
  if (typeof process === 'undefined' || !process.env) return
  const payload = publicBootPayload(mergeContextEnv(contextEnv))
  for (const [name, value] of Object.entries(payload)) {
    const current = String(process.env[name] || '').trim()
    if (!current || (name === 'FLOWLESS_URL' && isLocalFlowless(current) && !isLocalFlowless(value))) {
      process.env[name] = value
    }
    const pub = `PUBFLOW_PUBLIC_${name}`
    if (!String(process.env[pub] || '').trim()) process.env[pub] = value
  }
}

export function injectPublicBootHtml(html: string, contextEnv?: unknown): string {
  if (html.includes('__PUBFLOW_PUBLIC__')) return html
  const payload = publicBootPayload(mergeContextEnv(contextEnv))
  if (!Object.keys(payload).length) return html
  const json = JSON.stringify(payload).replace(/</g, '\\u003c')
  const tag = `<script>window.__PUBFLOW_PUBLIC__=Object.assign(window.__PUBFLOW_PUBLIC__||{},${json})</script>`
  if (html.includes('</head>')) return html.replace('</head>', `${tag}</head>`)
  if (html.includes('</body>')) return html.replace('</body>', `${tag}</body>`)
  return `${tag}${html}`
}

/**
 * Browser: `window.__PUBFLOW_PUBLIC__` (Worker runtime public vars) then Vite `publicEnv`.
 * Server: Vite then `serverEnv` / `process.env`.
 * `PUBFLOW_PUBLIC_FLOWLESS_URL` is enough; `API_BASE_URL` is that same origin.
 */
export function bootEnv(name: string, env?: EnvMap): string | undefined {
  if (typeof window !== 'undefined') {
    const fromBoot = window.__PUBFLOW_PUBLIC__?.[name]
    if (typeof fromBoot === 'string' && fromBoot.trim()) return fromBoot.trim()
  }
  const vite = publicEnv(name, env ?? readViteEnv())
  if (vite) return vite
  if (typeof process !== 'undefined') return serverEnv(name, env ?? readProcessEnv())
  return undefined
}
