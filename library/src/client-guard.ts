import path from 'node:path'
import { toPosix } from './scan.ts'

export const SERVER_ENTRY_IDS = [
  '@pubflow/native/db',
  '@pubflow/native/mail',
  '@pubflow/native/auth',
  '@pubflow/native/rate-limit',
] as const

function pageFromImporter(importer: string, root: string): string | null {
  const file = toPosix(importer.split('?')[0] || '')
  const pagesRoot = toPosix(path.resolve(root, 'app', 'pages'))
  if (file === pagesRoot || file.startsWith(`${pagesRoot}/`)) {
    return toPosix(path.relative(root, file))
  }
  return null
}

function resolveImport(importer: string, source: string, root: string): string {
  const spec = source.trim().split('?')[0].replace(/\\/g, '/')
  if (spec.startsWith('@/')) return toPosix(path.resolve(root, 'app', spec.slice(2)))
  if (spec.startsWith('.')) return toPosix(path.resolve(path.dirname(importer.split('?')[0] || ''), spec))
  return spec
}

function isAppApiFile(resolved: string, root: string): boolean {
  const apiRoot = toPosix(path.resolve(root, 'app', 'api'))
  const file = toPosix(resolved)
  return file === apiRoot || file.startsWith(`${apiRoot}/`)
}

function serverEntryName(spec: string): (typeof SERVER_ENTRY_IDS)[number] | null {
  for (const id of SERVER_ENTRY_IDS) {
    if (spec === id || spec.startsWith(`${id}/`)) return id
  }
  return null
}

/** Client (non-SSR) import that must fail the Vite build. Actions stay allowed (they are stubbed). */
export function guidedClientImportError(opts: {
  source: string
  importer: string
  root: string
}): string | null {
  if (!opts.importer) return null
  const spec = opts.source.trim().split('?')[0].replace(/\\/g, '/')
  const page = pageFromImporter(opts.importer, opts.root)
  const entry = serverEntryName(spec)
  if (entry === '@pubflow/native/db') {
    return page
      ? `[pubflow-native] getDb() from ${page} — move the query to app/api or app/actions.`
      : `[pubflow-native] getDb() cannot run in the browser. Move the query to app/api or app/actions.`
  }
  if (entry) {
    return page
      ? `[pubflow-native] ${entry} from ${page} — keep it in app/api or app/actions.`
      : `[pubflow-native] ${entry} cannot run in the browser. Keep it in app/api or app/actions.`
  }
  const resolved = resolveImport(opts.importer, spec, opts.root)
  if (isAppApiFile(resolved, opts.root)) {
    const from = page || 'the client'
    return `[pubflow-native] app/api cannot be imported from ${from} — fetch /api from the page.`
  }
  return null
}

/**
 * Runtime backup. The npm `server-only` package throws in Node/Bun SSR (no `react-server`
 * condition), so Native fails the **client build** in Vite and throws here only in a browser.
 */
export function forbidClient(what: string): void {
  const doc = (globalThis as { document?: unknown }).document
  if (doc) {
    throw new Error(
      `[pubflow-native] ${what} cannot run in the browser. Move the query to app/api or app/actions.`,
    )
  }
}
