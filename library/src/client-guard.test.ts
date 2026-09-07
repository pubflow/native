import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { guidedClientImportError } from './client-guard.ts'

const root = path.resolve('/app')

describe('guidedClientImportError', () => {
  it('fails a page import of getDb / native db', () => {
    const page = path.join(root, 'app', 'pages', 'index.tsx')
    expect(guidedClientImportError({ source: '@pubflow/native/db', importer: page, root })).toContain(
      'getDb() from app/pages/index.tsx',
    )
    expect(guidedClientImportError({ source: '@pubflow/native/db', importer: page, root })).toContain(
      'app/api or app/actions',
    )
  })

  it('fails native mail/auth/rate-limit from a page', () => {
    const page = path.join(root, 'app', 'pages', 'dash.tsx')
    expect(guidedClientImportError({ source: '@pubflow/native/mail', importer: page, root })).toContain(
      '@pubflow/native/mail from app/pages/dash.tsx',
    )
    expect(guidedClientImportError({ source: '@pubflow/native/auth', importer: page, root })).toContain(
      '@pubflow/native/auth',
    )
    expect(guidedClientImportError({ source: '@pubflow/native/rate-limit', importer: page, root })).toContain(
      'rate-limit',
    )
  })

  it('fails a relative or @/ import of app/api from a page', () => {
    const page = path.join(root, 'app', 'pages', 'items', 'index.tsx')
    expect(guidedClientImportError({ source: '../../api/items', importer: page, root })).toContain(
      'app/api cannot be imported from app/pages/items/index.tsx',
    )
    expect(guidedClientImportError({ source: '@/api/items', importer: page, root })).toContain('fetch /api')
  })

  it('allows actions, pages, and public native imports', () => {
    const page = path.join(root, 'app', 'pages', 'index.tsx')
    expect(guidedClientImportError({ source: '../actions/ping', importer: page, root })).toBeNull()
    expect(guidedClientImportError({ source: '@pubflow/native', importer: page, root })).toBeNull()
    expect(guidedClientImportError({ source: '@tanstack/react-router', importer: page, root })).toBeNull()
    expect(
      guidedClientImportError({
        source: '@pubflow/native/db',
        importer: path.join(root, 'app', 'lib', 'db.ts'),
        root,
      }),
    ).toContain('getDb() cannot run in the browser')
  })
})
