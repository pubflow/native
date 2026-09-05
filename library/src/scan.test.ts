import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { scanActions, scanApi, scanPages } from './scan.ts'

function tmpProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pubflow-native-scan-'))
  fs.mkdirSync(path.join(root, 'app', 'pages', 'users'), { recursive: true })
  fs.mkdirSync(path.join(root, 'app', 'api', 'webhooks'), { recursive: true })
  fs.writeFileSync(path.join(root, 'app', 'pages', 'index.tsx'), 'export default function Home() { return null }')
  fs.writeFileSync(path.join(root, 'app', 'pages', 'users', '[id].tsx'), 'export default function User() { return null }')
  fs.writeFileSync(path.join(root, 'app', 'api', 'users.ts'), 'export default {}')
  fs.writeFileSync(path.join(root, 'app', 'api', '_middleware.ts'), 'export default async function mw() {}')
  fs.writeFileSync(path.join(root, 'app', 'api', 'webhooks', 'stripe.ts'), 'export default {}')
  fs.mkdirSync(path.join(root, 'app', 'actions', 'posts'), { recursive: true })
  fs.writeFileSync(path.join(root, 'app', 'actions', 'posts', 'createPost.ts'), 'export async function createPost() {}')
  fs.writeFileSync(path.join(root, 'app', 'actions', 'posts', '_middleware.ts'), 'export default async function mw() {}')
  fs.writeFileSync(path.join(root, 'app', 'actions', '_auth.ts'), 'export { requireAuth } from "../lib/auth"')
  return root
}

describe('scanPages', () => {
  it('maps [id].tsx to a param page', () => {
    const root = tmpProject()
    const pages = scanPages(root)
    const idPage = pages.find((file) => file.param === 'id')
    expect(idPage).toBeTruthy()
    expect(idPage?.kind).toBe('page')
    expect(idPage?.dir).toEqual(['users'])
    expect(idPage?.rel).toBe('users/[id].tsx')
    fs.rmSync(root, { recursive: true, force: true })
  })
})

describe('scanApi', () => {
  it('mounts users.ts at /users and flags _middleware', () => {
    const root = tmpProject()
    const apis = scanApi(root)
    expect(apis.find((file) => file.rel === 'users.ts')?.mount).toBe('/users')
    expect(apis.find((file) => file.rel === 'webhooks/stripe.ts')?.mount).toBe('/webhooks/stripe')
    const mw = apis.find((file) => file.rel === '_middleware.ts')
    expect(mw?.isMiddleware).toBe(true)
    expect(mw?.mount).toBe('/')
    fs.rmSync(root, { recursive: true, force: true })
  })
})

describe('scanActions', () => {
  it('builds dotted prefixes and flags _middleware / _auth', () => {
    const root = tmpProject()
    const actions = scanActions(root)
    expect(actions.find((file) => file.rel === 'posts/createPost.ts')?.prefix).toBe('posts.createPost')
    expect(actions.find((file) => file.rel === 'posts/_middleware.ts')?.isMiddleware).toBe(true)
    expect(actions.find((file) => file.rel === '_auth.ts')?.isAuth).toBe(true)
    fs.rmSync(root, { recursive: true, force: true })
  })
})
