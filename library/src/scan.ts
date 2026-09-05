import fs from 'node:fs'
import path from 'node:path'
import { toPosix } from './access.ts'

export { actionId, toPosix } from './access.ts'

export type PageKind = 'layout' | 'index' | 'page' | 'error' | 'pending'

export type PageFile = {
  abs: string
  rel: string
  /** Directory segments under app/pages, excluding the file name. */
  dir: string[]
  kind: PageKind
  /** TanStack param name without `$`, when the file is `[id].tsx`. */
  param?: string
  /** Last static URL segment for named files like `about.tsx`. */
  name?: string
}

export type ApiFile = {
  abs: string
  rel: string
  /** Mount path under `/api`, e.g. `/users` or `/webhooks/stripe`. */
  mount: string
  isMiddleware: boolean
}

export type ActionFile = {
  abs: string
  rel: string
  /** Dotted prefix from the file path, e.g. `posts.createPost`. */
  prefix: string
  isMiddleware: boolean
  isAuth: boolean
}

const PAGE_EXT = /\.(tsx|jsx|ts|js)$/
const API_EXT = /\.(ts|js)$/

export function exists(file: string): boolean {
  try {
    return fs.existsSync(file)
  } catch {
    return false
  }
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  if (!exists(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(abs, acc)
    else acc.push(abs)
  }
  return acc
}

function parsePageFile(pagesRoot: string, abs: string): PageFile | null {
  const rel = toPosix(path.relative(pagesRoot, abs))
  if (rel.startsWith('..')) return null
  if (!PAGE_EXT.test(rel)) return null
  const parts = rel.split('/')
  const file = parts.pop()!
  const dir = parts
  const base = file.replace(PAGE_EXT, '')
  if (base.startsWith('_')) return null
  if (base === 'layout') return { abs, rel, dir, kind: 'layout' }
  if (base === 'index') return { abs, rel, dir, kind: 'index' }
  if (base === 'error') return { abs, rel, dir, kind: 'error' }
  if (base === 'pending') return { abs, rel, dir, kind: 'pending' }
  const param = base.match(/^\[(.+)\]$/)
  if (param) return { abs, rel, dir, kind: 'page', param: param[1] }
  return { abs, rel, dir, kind: 'page', name: base }
}

export function scanPages(root: string): PageFile[] {
  const pagesRoot = path.join(root, 'app', 'pages')
  return walkFiles(pagesRoot)
    .map((abs) => parsePageFile(pagesRoot, abs))
    .filter((file): file is PageFile => Boolean(file))
    .sort((a, b) => a.rel.localeCompare(b.rel))
}

function fileToApiMount(rel: string): { mount: string; isMiddleware: boolean } {
  const posix = toPosix(rel).replace(API_EXT, '')
  const parts = posix.split('/').filter(Boolean)
  const last = parts[parts.length - 1]
  if (last === '_middleware') {
    return { mount: '/' + parts.slice(0, -1).join('/'), isMiddleware: true }
  }
  return { mount: '/' + parts.join('/'), isMiddleware: false }
}

export function scanActions(root: string): ActionFile[] {
  const actionsRoot = path.join(root, 'app', 'actions')
  return walkFiles(actionsRoot)
    .filter((abs) => API_EXT.test(abs) && !abs.endsWith('.d.ts'))
    .map((abs) => {
      const rel = toPosix(path.relative(actionsRoot, abs))
      const parts = rel.replace(API_EXT, '').split('/').filter(Boolean)
      const last = parts[parts.length - 1]
      const isMiddleware = last === '_middleware'
      const isAuth = last === '_auth'
      const prefix = parts.filter((part) => part !== '_middleware' && part !== '_auth').join('.')
      return { abs, rel, prefix, isMiddleware, isAuth }
    })
    .sort((a, b) => a.rel.localeCompare(b.rel))
}

export function scanApi(root: string): ApiFile[] {
  const apiRoot = path.join(root, 'app', 'api')
  return walkFiles(apiRoot)
    .filter((abs) => API_EXT.test(abs) && !abs.endsWith('.d.ts'))
    .map((abs) => {
      const rel = toPosix(path.relative(apiRoot, abs))
      const { mount, isMiddleware } = fileToApiMount(rel)
      return { abs, rel, mount, isMiddleware }
    })
    .sort((a, b) => a.rel.localeCompare(b.rel))
}

export function hasCustomServer(root: string): boolean {
  return exists(path.join(root, 'app', 'server.ts')) || exists(path.join(root, 'app', 'server.tsx'))
}

export function customServerPath(root: string): string | null {
  const ts = path.join(root, 'app', 'server.ts')
  const tsx = path.join(root, 'app', 'server.tsx')
  if (exists(ts)) return ts
  if (exists(tsx)) return tsx
  return null
}

export function generatedDir(root: string): string {
  return path.join(root, '.pubflow', 'generated')
}

export function importFromGenerated(root: string, abs: string): string {
  const from = generatedDir(root)
  let rel = toPosix(path.relative(from, abs))
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel.replace(PAGE_EXT, '').replace(API_EXT, '')
}
