type EnvMap = Record<string, string | undefined>

function readViteEnv(): EnvMap {
  return import.meta.env as unknown as EnvMap
}

function readProcessEnv(): EnvMap {
  if (typeof process === 'undefined' || !process.env) return {}
  return process.env
}

function firstDefined(env: EnvMap, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
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
