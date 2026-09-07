export type DatabaseProvider = 'postgres' | 'mysql' | 'neon' | 'planetscale' | 'libsql'

/** Cloudflare Hyperdrive binding (`env.HYPERDRIVE`). */
export type HyperdriveBinding = {
  connectionString: string
  host?: string
  port?: number | string
  user?: string
  password?: string
  database?: string
}

export type DbEnv = NodeJS.ProcessEnv | Record<string, unknown>

export type ParsedDatabaseUrl = {
  provider: DatabaseProvider
  url: string
  authToken?: string
  /** True when the URL came from a Hyperdrive binding. Use pool max 1. */
  hyperdrive?: boolean
  hyperdriveBinding?: HyperdriveBinding
}

const WORKER_ENV_KEY = '__pubflowNativeWorkerEnv'

type GlobalBag = typeof globalThis & { [WORKER_ENV_KEY]?: Record<string, unknown> }

/** Call once per Worker request (worker-entry does this). Lets `getDb()` see `env.HYPERDRIVE`. */
export function bindWorkerEnv(env: unknown): void {
  if (env && typeof env === 'object') {
    ;(globalThis as GlobalBag)[WORKER_ENV_KEY] = env as Record<string, unknown>
  }
}

export function unbindWorkerEnv(): void {
  delete (globalThis as GlobalBag)[WORKER_ENV_KEY]
}

function asBag(env?: DbEnv): Record<string, unknown> {
  const base = process.env as unknown as Record<string, unknown>
  if (env && typeof env === 'object') return env as Record<string, unknown>
  const bound = (globalThis as GlobalBag)[WORKER_ENV_KEY]
  if (bound) return { ...base, ...bound }
  return base
}

function envString(bag: Record<string, unknown>, name: string): string {
  const value = bag[name]
  return typeof value === 'string' ? value.trim() : ''
}

function readHyperdrive(bag: Record<string, unknown>): HyperdriveBinding | null {
  const raw = bag.HYPERDRIVE
  if (!raw || typeof raw !== 'object') return null
  const binding = raw as HyperdriveBinding
  if (typeof binding.connectionString !== 'string' || !binding.connectionString.trim()) return null
  return binding
}

function detectProviderFromUrl(url: string): DatabaseProvider | null {
  if (!url) return null
  const lower = url.toLowerCase()
  if (lower.startsWith('libsql://') || lower.startsWith('file:')) return 'libsql'
  if (lower.startsWith('postgresql://') || lower.startsWith('postgres://')) {
    return lower.includes('.neon.tech') ? 'neon' : 'postgres'
  }
  if (lower.startsWith('mysql://')) {
    return lower.includes('.psdb.cloud') ? 'planetscale' : 'mysql'
  }
  return null
}

function normalizeProvider(raw?: string): DatabaseProvider | null {
  if (!raw) return null
  const value = raw.trim().toLowerCase()
  if (value === 'postgresql' || value === 'postgres') return 'postgres'
  if (value === 'mysql') return 'mysql'
  if (value === 'neon' || value === 'neon-http') return 'neon'
  if (value === 'planetscale') return 'planetscale'
  if (value === 'libsql' || value === 'turso') return 'libsql'
  return null
}

function resolveLibsqlUrlAndToken(url: string, fallbackToken?: string): { url: string; authToken?: string } {
  if (!url) return { url, authToken: fallbackToken }
  try {
    const parsed = new URL(url)
    const tokenFromUrl =
      parsed.searchParams.get('authToken') ||
      parsed.searchParams.get('token') ||
      parsed.searchParams.get('auth_token') ||
      undefined
    parsed.searchParams.delete('authToken')
    parsed.searchParams.delete('token')
    parsed.searchParams.delete('auth_token')
    return { url: parsed.toString(), authToken: tokenFromUrl || fallbackToken }
  } catch {
    return { url, authToken: fallbackToken }
  }
}

function readDatabaseUrl(bag: Record<string, unknown>): string {
  return (
    envString(bag, 'DATABASE_URL') ||
    envString(bag, 'NEON_DATABASE_URL') ||
    envString(bag, 'PLANETSCALE_DATABASE_URL') ||
    envString(bag, 'TURSO_DATABASE_URL')
  )
}

/**
 * Parse `DATABASE_URL` (and optional `DATABASE_PROVIDER`).
 * On Workers, `env.HYPERDRIVE.connectionString` wins over `DATABASE_URL`.
 * Turso token: `?authToken=` on the URL, or `TURSO_AUTH_TOKEN` if the query is empty.
 */
export function parseDatabaseUrl(env?: DbEnv): ParsedDatabaseUrl | null {
  const bag = asBag(env)
  const hyperdriveBinding = readHyperdrive(bag)
  const databaseUrl = hyperdriveBinding?.connectionString.trim() || readDatabaseUrl(bag)
  if (!databaseUrl) return null

  const explicit = normalizeProvider(envString(bag, 'DATABASE_PROVIDER'))
  const detected = detectProviderFromUrl(databaseUrl)
  const provider = explicit || detected
  if (!provider) {
    throw new Error(
      `Could not detect database provider from DATABASE_URL. Use postgres://, mysql://, libsql://, or file:.`,
    )
  }

  if (provider === 'libsql') {
    const libsql = resolveLibsqlUrlAndToken(
      databaseUrl,
      envString(bag, 'TURSO_AUTH_TOKEN') || envString(bag, 'LIBSQL_AUTH_TOKEN'),
    )
    return { provider, url: libsql.url, authToken: libsql.authToken }
  }

  return {
    provider,
    url: databaseUrl,
    hyperdrive: Boolean(hyperdriveBinding),
    hyperdriveBinding: hyperdriveBinding || undefined,
  }
}

type KyselyLike = {
  destroy?: () => Promise<void>
}

let dbInstance: KyselyLike | null = null
let dbKey = ''

async function missingPeer(name: string): Promise<never> {
  throw new Error(`Install ${name} to use @pubflow/native/db with this DATABASE_URL.`)
}

async function load<T>(name: string): Promise<T> {
  try {
    return (await import(name)) as T
  } catch {
    return missingPeer(name)
  }
}

function postgresPoolOpts(parsed: ParsedDatabaseUrl) {
  if (parsed.hyperdrive) return { connectionString: parsed.url, max: 1 }
  return { connectionString: parsed.url }
}

function mysqlPoolOpts(parsed: ParsedDatabaseUrl) {
  const binding = parsed.hyperdriveBinding
  if (parsed.hyperdrive && binding?.host) {
    const port = typeof binding.port === 'string' ? Number(binding.port) : binding.port
    return {
      host: binding.host,
      user: binding.user,
      password: binding.password,
      database: binding.database,
      port: Number.isFinite(port) ? port : undefined,
      connectionLimit: 1,
      disableEval: true,
    }
  }
  if (parsed.hyperdrive) {
    return { uri: parsed.url, connectionLimit: 1, disableEval: true }
  }
  return { uri: parsed.url }
}

async function createKysely(parsed: ParsedDatabaseUrl): Promise<KyselyLike> {
  const kysely = await load<{
    Kysely: new (opts: { dialect: unknown }) => KyselyLike
    PostgresDialect: new (opts: { pool: unknown }) => unknown
    MysqlDialect: new (opts: { pool: unknown }) => unknown
  }>('kysely')

  if (parsed.provider === 'postgres' || parsed.provider === 'neon') {
    const pg = await load<{ default: { Pool: new (opts: Record<string, unknown>) => unknown } }>('pg')
    const Pool = pg.default?.Pool || (pg as unknown as { Pool: new (opts: Record<string, unknown>) => unknown }).Pool
    return new kysely.Kysely({
      dialect: new kysely.PostgresDialect({ pool: new Pool(postgresPoolOpts(parsed)) }),
    })
  }

  if (parsed.provider === 'mysql' || parsed.provider === 'planetscale') {
    const mysql = await load<{ createPool: (opts: Record<string, unknown>) => unknown }>('mysql2')
    return new kysely.Kysely({
      dialect: new kysely.MysqlDialect({ pool: mysql.createPool(mysqlPoolOpts(parsed)) }),
    })
  }

  const libsql = await load<{ LibsqlDialect: new (opts: { url: string; authToken?: string }) => unknown }>(
    '@libsql/kysely-libsql',
  )
  return new kysely.Kysely({
    dialect: new libsql.LibsqlDialect({ url: parsed.url, authToken: parsed.authToken }),
  })
}

function instanceKey(parsed: ParsedDatabaseUrl): string {
  return `${parsed.provider}:${parsed.url}:${parsed.authToken || ''}:${parsed.hyperdrive ? 'hyperdrive' : 'direct'}`
}

export async function createDb(env?: DbEnv): Promise<KyselyLike> {
  const parsed = parseDatabaseUrl(env)
  if (!parsed) {
    throw new Error('DATABASE_URL is not set')
  }
  return createKysely(parsed)
}

/** Lazy singleton. Throws if `DATABASE_URL` is empty and there is no Hyperdrive binding. */
export async function getDb(env?: DbEnv): Promise<KyselyLike> {
  const parsed = parseDatabaseUrl(env)
  if (!parsed) throw new Error('DATABASE_URL is not set')
  const key = instanceKey(parsed)
  if (dbInstance && dbKey === key) return dbInstance
  dbInstance = await createKysely(parsed)
  dbKey = key
  return dbInstance
}

export async function closeDb(): Promise<void> {
  if (dbInstance?.destroy) await dbInstance.destroy()
  dbInstance = null
  dbKey = ''
}
