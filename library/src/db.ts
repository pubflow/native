export type DatabaseProvider = 'postgres' | 'mysql' | 'neon' | 'planetscale' | 'libsql'

export type ParsedDatabaseUrl = {
  provider: DatabaseProvider
  url: string
  authToken?: string
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

function readDatabaseUrl(env: NodeJS.ProcessEnv): string {
  return (
    env.DATABASE_URL ||
    env.NEON_DATABASE_URL ||
    env.PLANETSCALE_DATABASE_URL ||
    env.TURSO_DATABASE_URL ||
    ''
  ).trim()
}

/**
 * Parse `DATABASE_URL` (and optional `DATABASE_PROVIDER`).
 * Turso token: `?authToken=` on the URL, or `TURSO_AUTH_TOKEN` if the query is empty.
 */
export function parseDatabaseUrl(env: NodeJS.ProcessEnv = process.env): ParsedDatabaseUrl | null {
  const databaseUrl = readDatabaseUrl(env)
  if (!databaseUrl) return null

  const explicit = normalizeProvider(env.DATABASE_PROVIDER)
  const detected = detectProviderFromUrl(databaseUrl)
  const provider = explicit || detected
  if (!provider) {
    throw new Error(
      `Could not detect database provider from DATABASE_URL. Use postgres://, mysql://, libsql://, or file:.`,
    )
  }

  if (provider === 'libsql') {
    const libsql = resolveLibsqlUrlAndToken(databaseUrl, env.TURSO_AUTH_TOKEN || env.LIBSQL_AUTH_TOKEN)
    return { provider, url: libsql.url, authToken: libsql.authToken }
  }

  return { provider, url: databaseUrl }
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

async function createKysely(parsed: ParsedDatabaseUrl): Promise<KyselyLike> {
  const kysely = await load<{
    Kysely: new (opts: { dialect: unknown }) => KyselyLike
    PostgresDialect: new (opts: { pool: unknown }) => unknown
    MysqlDialect: new (opts: { pool: unknown }) => unknown
  }>('kysely')

  if (parsed.provider === 'postgres' || parsed.provider === 'neon') {
    const pg = await load<{ default: { Pool: new (opts: { connectionString: string }) => unknown } }>('pg')
    const Pool = pg.default?.Pool || (pg as unknown as { Pool: new (opts: { connectionString: string }) => unknown }).Pool
    return new kysely.Kysely({
      dialect: new kysely.PostgresDialect({ pool: new Pool({ connectionString: parsed.url }) }),
    })
  }

  if (parsed.provider === 'mysql' || parsed.provider === 'planetscale') {
    const mysql = await load<{ createPool: (opts: { uri: string }) => unknown }>('mysql2')
    return new kysely.Kysely({
      dialect: new kysely.MysqlDialect({ pool: mysql.createPool({ uri: parsed.url }) }),
    })
  }

  const libsql = await load<{ LibsqlDialect: new (opts: { url: string; authToken?: string }) => unknown }>(
    '@libsql/kysely-libsql',
  )
  return new kysely.Kysely({
    dialect: new libsql.LibsqlDialect({ url: parsed.url, authToken: parsed.authToken }),
  })
}

export async function createDb(env: NodeJS.ProcessEnv = process.env): Promise<KyselyLike> {
  const parsed = parseDatabaseUrl(env)
  if (!parsed) {
    throw new Error('DATABASE_URL is not set')
  }
  return createKysely(parsed)
}

/** Lazy singleton. Throws if `DATABASE_URL` is empty. */
export async function getDb(env: NodeJS.ProcessEnv = process.env): Promise<KyselyLike> {
  const parsed = parseDatabaseUrl(env)
  if (!parsed) throw new Error('DATABASE_URL is not set')
  const key = `${parsed.provider}:${parsed.url}:${parsed.authToken || ''}`
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
