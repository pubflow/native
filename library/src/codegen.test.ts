import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generateNative } from './codegen.ts'

describe('generateNative', () => {
  it('emits $id for [id].tsx and INDEX_HTML on the router', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pubflow-native-codegen-'))
    fs.mkdirSync(path.join(root, 'app', 'pages', 'users'), { recursive: true })
    fs.writeFileSync(path.join(root, 'app', 'pages', 'layout.tsx'), 'export default function L({ children }) { return children }')
    fs.writeFileSync(path.join(root, 'app', 'pages', 'index.tsx'), 'export default function Home() { return null }')
    fs.writeFileSync(path.join(root, 'app', 'pages', 'users', '[id].tsx'), 'export default function User() { return null }')
    generateNative(root, '<html><div id="root"></div></html>')
    const router = fs.readFileSync(path.join(root, '.pubflow', 'generated', 'router.tsx'), 'utf8')
    expect(router).toContain('"$id"')
    expect(router).toContain('INDEX_HTML')
    const client = fs.readFileSync(path.join(root, '.pubflow', 'generated', 'client.tsx'), 'utf8')
    expect(client).toContain('router.load()')
    fs.rmSync(root, { recursive: true, force: true })
  })
})
