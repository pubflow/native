type EnvMap = Record<string, string | undefined>

function readViteEnv(): EnvMap {
  return import.meta.env as unknown as EnvMap
}

/**
 * Client env. Reads `PUBFLOW_PUBLIC_<name>` then `VITE_<name>`.
 * Server secrets must stay unprefixed (`FLOWLESS_URL`, `DATABASE_URL`) so Vite never inlines them.
 */
export function publicEnv(name: string, env: EnvMap = readViteEnv()): string | undefined {
  const fromPubflow = env[`PUBFLOW_PUBLIC_${name}`]
  if (fromPubflow) return fromPubflow
  const fromVite = env[`VITE_${name}`]
  if (fromVite) return fromVite
  return undefined
}
