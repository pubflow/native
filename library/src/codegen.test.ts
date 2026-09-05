import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generateNative } from './codegen.ts'

function writePage(root: string, rel: string, source = 'export default function P() { return null }') {
  const abs = path.join(root, 'app', 'pages', rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, source)
}

describe('generateNative', () => {
  it('emits $id for [id].tsx, withParams, and INDEX_HTML on the router', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pubflow-native-codegen-'))
    fs.mkdirSync(path.join(root, 'app', 'pages', 'users'), { recursive: true })
    fs.writeFileSync(path.join(root, 'app', 'pages', 'layout.tsx'), 'export default function L({ children }) { return children }')
    fs.writeFileSync(path.join(root, 'app', 'pages', 'index.tsx'), 'export default function Home() { return null }')
    fs.writeFileSync(path.join(root, 'app', 'pages', 'users', '[id].tsx'), 'export default function User() { return null }')
    generateNative(root, '<html><div id="root"></div></html>')
    const router = fs.readFileSync(path.join(root, '.pubflow', 'generated', 'router.tsx'), 'utf8')
    expect(router).toContain('"$id"')
    expect(router).toContain('withParams')
    expect(router).toContain('useParams')
    expect(router).toContain('INDEX_HTML')
    const client = fs.readFileSync(path.join(root, '.pubflow', 'generated', 'client.tsx'), 'utf8')
    expect(client).toContain('router.load()')
    const server = fs.readFileSync(path.join(root, '.pubflow', 'generated', 'server.ts'), 'utf8')
    expect(server).toContain('createActionsApp')
    expect(server).toContain("api.route('/actions'")
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('emits $id for a [id] folder and nested pages', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pubflow-native-codegen-'))
    writePage(root, 'products/index.tsx')
    writePage(root, 'products/edit.tsx')
    writePage(root, 'products/[id]/index.tsx')
    writePage(root, 'products/layout.tsx', 'export default function L({ children }) { return children }')
    const result = generateNative(root)
    const router = fs.readFileSync(path.join(root, '.pubflow', 'generated', 'router.tsx'), 'utf8')
    expect(router).toContain('"$id"')
    expect(router).toContain('"products"')
    expect(router).toContain('"edit"')
    const types = fs.readFileSync(path.join(root, '.pubflow', 'generated', 'types.d.ts'), 'utf8')
    expect(types).toContain('"/products"')
    expect(types).toContain('"/products/$id"')
    expect(types).toContain('"/products/edit"')
    expect(result.warnings).toEqual([])
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('prefers a products/ folder over products.tsx', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pubflow-native-codegen-'))
    writePage(root, 'index.tsx')
    writePage(root, 'products.tsx')
    writePage(root, 'products/index.tsx')
    const result = generateNative(root)
    expect(result.warnings.some((line) => line.includes('products.tsx') && line.includes('products/'))).toBe(true)
    const router = fs.readFileSync(path.join(root, '.pubflow', 'generated', 'router.tsx'), 'utf8')
    expect(router).not.toContain("from '../../app/pages/products'")
    expect(router).toContain("from '../../app/pages/products/index'")
    fs.rmSync(root, { recursive: true, force: true })
  })
})
