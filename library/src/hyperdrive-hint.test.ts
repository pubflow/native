import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  databaseUrlFromEnv,
  HYPERDRIVE_HINT,
  HYPERDRIVE_GUIDE_URL,
  isTcpDatabaseUrl,
  shouldWarnHyperdrive,
  wranglerConfigSource,
  wranglerHasHyperdriveBinding,
} from './hyperdrive-hint.ts'

const STARTER_WRANGLER = `{
  "name": "pubflow-native",
  "main": "dist/server/worker.js",
  // Postgres/MySQL on Workers: create Hyperdrive, then:
  // "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<id>" }],
  "alias": {}
}
`

describe('isTcpDatabaseUrl', () => {
  it('detects postgres and mysql, not libsql or empty', () => {
    expect(isTcpDatabaseUrl('postgres://u:p@localhost/db')).toBe(true)
    expect(isTcpDatabaseUrl('postgresql://u:p@host/db')).toBe(true)
    expect(isTcpDatabaseUrl('mysql://u:p@host/db')).toBe(true)
    expect(isTcpDatabaseUrl('libsql://app-user.turso.io')).toBe(false)
    expect(isTcpDatabaseUrl('file:./dev.db')).toBe(false)
    expect(isTcpDatabaseUrl('')).toBe(false)
  })

  it('honors DATABASE_PROVIDER and never treats Turso as TCP', () => {
    expect(isTcpDatabaseUrl('postgres://u:p@h/db', 'libsql')).toBe(false)
    expect(isTcpDatabaseUrl('libsql://app.turso.io', 'postgres')).toBe(false)
    expect(isTcpDatabaseUrl('something-custom', 'mysql')).toBe(true)
  })
})

describe('wranglerHasHyperdriveBinding', () => {
  it('ignores a commented starter block and placeholder ids', () => {
    expect(wranglerHasHyperdriveBinding(STARTER_WRANGLER)).toBe(false)
    expect(
      wranglerHasHyperdriveBinding(`{
        "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<id>" }]
      }`),
    ).toBe(false)
  })

  it('detects an uncommented jsonc binding and toml', () => {
    expect(
      wranglerHasHyperdriveBinding(`{
        "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "abc123" }]
      }`),
    ).toBe(true)
    expect(
      wranglerHasHyperdriveBinding(`
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "abc123"
`),
    ).toBe(true)
  })
})

describe('shouldWarnHyperdrive', () => {
  it('warns only on SSR Worker builds with TCP URL and no binding', () => {
    expect(
      shouldWarnHyperdrive({
        isSsrBuild: true,
        wranglerSource: STARTER_WRANGLER,
        databaseUrl: 'postgres://u:p@h/db',
      }),
    ).toBe(true)
    expect(
      shouldWarnHyperdrive({
        isSsrBuild: false,
        wranglerSource: STARTER_WRANGLER,
        databaseUrl: 'postgres://u:p@h/db',
      }),
    ).toBe(false)
    expect(
      shouldWarnHyperdrive({
        isSsrBuild: true,
        wranglerSource: null,
        databaseUrl: 'postgres://u:p@h/db',
      }),
    ).toBe(false)
    expect(
      shouldWarnHyperdrive({
        isSsrBuild: true,
        wranglerSource: STARTER_WRANGLER,
        databaseUrl: 'libsql://app.turso.io',
      }),
    ).toBe(false)
    expect(
      shouldWarnHyperdrive({
        isSsrBuild: true,
        wranglerSource: STARTER_WRANGLER,
        databaseUrl: '',
      }),
    ).toBe(false)
    expect(
      shouldWarnHyperdrive({
        isSsrBuild: true,
        wranglerSource: `{ "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "real-id" }] }`,
        databaseUrl: 'mysql://u:p@h/db',
      }),
    ).toBe(false)
  })
})

describe('wranglerConfigSource', () => {
  it('reads wrangler.jsonc from the project root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pubflow-native-hd-'))
    fs.writeFileSync(path.join(root, 'wrangler.jsonc'), STARTER_WRANGLER)
    expect(wranglerConfigSource(root)).toContain('pubflow-native')
    expect(databaseUrlFromEnv({ NEON_DATABASE_URL: ' postgres://u:p@h/db ' })).toBe(
      'postgres://u:p@h/db',
    )
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('treats the template wrangler.jsonc as unbound', () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
    const source = fs.readFileSync(path.join(repoRoot, 'starter', 'wrangler.jsonc'), 'utf8')
    expect(wranglerHasHyperdriveBinding(source)).toBe(false)
    expect(HYPERDRIVE_HINT).toContain(HYPERDRIVE_GUIDE_URL)
    expect(HYPERDRIVE_HINT).toContain('[pubflow-native]')
  })
})
