import { afterEach, describe, expect, it } from 'bun:test'
import { bindWorkerEnv, parseDatabaseUrl, unbindWorkerEnv } from './db.ts'

describe('parseDatabaseUrl', () => {
  afterEach(() => {
    unbindWorkerEnv()
  })

  it('detects postgres, neon, mysql, planetscale, and libsql', () => {
    expect(parseDatabaseUrl({ DATABASE_URL: 'postgres://u:p@localhost:5432/db' })?.provider).toBe('postgres')
    expect(parseDatabaseUrl({ DATABASE_URL: 'postgresql://u:p@ep-x.us-east-1.aws.neon.tech/neondb' })?.provider).toBe(
      'neon',
    )
    expect(parseDatabaseUrl({ DATABASE_URL: 'mysql://u:p@localhost:3306/db' })?.provider).toBe('mysql')
    expect(parseDatabaseUrl({ DATABASE_URL: 'mysql://u:p@aws.connect.psdb.cloud/db' })?.provider).toBe('planetscale')
    expect(parseDatabaseUrl({ DATABASE_URL: 'libsql://app-user.turso.io' })?.provider).toBe('libsql')
    expect(parseDatabaseUrl({ DATABASE_URL: 'file:./dev.db' })?.provider).toBe('libsql')
  })

  it('honors DATABASE_PROVIDER override', () => {
    expect(
      parseDatabaseUrl({
        DATABASE_URL: 'postgres://u:p@localhost/db',
        DATABASE_PROVIDER: 'neon',
      })?.provider,
    ).toBe('neon')
  })

  it('pulls Turso token from the URL query and strips it', () => {
    const parsed = parseDatabaseUrl({
      DATABASE_URL: 'libsql://app-user.turso.io?authToken=secret-token',
    })
    expect(parsed?.authToken).toBe('secret-token')
    expect(parsed?.url).not.toContain('authToken')
  })

  it('falls back to TURSO_AUTH_TOKEN when the URL has no token', () => {
    const parsed = parseDatabaseUrl({
      DATABASE_URL: 'libsql://app-user.turso.io',
      TURSO_AUTH_TOKEN: 'env-token',
    })
    expect(parsed?.authToken).toBe('env-token')
  })

  it('returns null without a URL and accepts documented fallbacks', () => {
    expect(parseDatabaseUrl({})).toBeNull()
    expect(parseDatabaseUrl({ NEON_DATABASE_URL: 'postgres://u:p@ep-x.neon.tech/db' })?.provider).toBe('neon')
  })

  it('prefers Hyperdrive connectionString over DATABASE_URL and marks hyperdrive', () => {
    const parsed = parseDatabaseUrl({
      DATABASE_URL: 'postgres://local/db',
      HYPERDRIVE: { connectionString: 'postgres://edge:secret@hyperdrive.example/app' },
    })
    expect(parsed?.provider).toBe('postgres')
    expect(parsed?.url).toBe('postgres://edge:secret@hyperdrive.example/app')
    expect(parsed?.hyperdrive).toBe(true)
  })

  it('detects mysql Hyperdrive and keeps host fields for mysql2', () => {
    const parsed = parseDatabaseUrl({
      HYPERDRIVE: {
        connectionString: 'mysql://u:p@hyperdrive.example:3306/shop',
        host: 'hyperdrive.example',
        port: 3306,
        user: 'u',
        password: 'p',
        database: 'shop',
      },
    })
    expect(parsed?.provider).toBe('mysql')
    expect(parsed?.hyperdrive).toBe(true)
    expect(parsed?.hyperdriveBinding?.host).toBe('hyperdrive.example')
  })

  it('reads HYPERDRIVE from bindWorkerEnv when getDb env is omitted', () => {
    bindWorkerEnv({
      HYPERDRIVE: { connectionString: 'postgres://bound:pw@hd.example/db' },
    })
    const parsed = parseDatabaseUrl()
    expect(parsed?.url).toBe('postgres://bound:pw@hd.example/db')
    expect(parsed?.hyperdrive).toBe(true)
  })
})
