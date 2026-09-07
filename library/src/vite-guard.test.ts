import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import type { Plugin } from 'vite'
import native from './vite.ts'

function guardPlugin(root: string): Plugin {
  const plugins = native({ root }).flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
  const plugin = plugins.find((entry) => entry && typeof entry === 'object' && 'name' in entry && entry.name === 'pubflow-native-server-guard')
  if (!plugin || typeof plugin === 'boolean') throw new Error('missing server-guard plugin')
  return plugin as Plugin
}

describe('native server-guard plugin', () => {
  it('throws on a client page import of getDb and ignores SSR', () => {
    const root = path.resolve('/app')
    const plugin = guardPlugin(root)
    const page = path.join(root, 'app', 'pages', 'index.tsx')
    const resolveId = plugin.resolveId
    if (typeof resolveId !== 'function') throw new Error('resolveId')
    expect(() => resolveId.call(plugin, '@pubflow/native/db', page, { ssr: false })).toThrow(
      /getDb\(\) from app\/pages\/index\.tsx/,
    )
    expect(resolveId.call(plugin, '@pubflow/native/db', page, { ssr: true })).toBeNull()
  })
})
