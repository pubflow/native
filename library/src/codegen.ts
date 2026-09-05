import fs from 'node:fs'
import path from 'node:path'
import { listExportedFunctions } from './actions.ts'
import { preferFolderMounts } from './api-path.ts'
import {
  actionId,
  customServerPath,
  generatedDir,
  hasCustomServer,
  importFromGenerated,
  scanActions,
  scanApi,
  scanPages,
  toPosix,
  type PageFile,
} from './scan.ts'

type DirNode = {
  key: string
  dir: string[]
  layout?: PageFile
  index?: PageFile
  error?: PageFile
  pending?: PageFile
  pages: PageFile[]
  children: Map<string, DirNode>
}

function ident(prefix: string, parts: string[]): string {
  const raw = [prefix, ...parts].join('_').replace(/[^a-zA-Z0-9_]/g, '_')
  return raw.replace(/_+/g, '_') || prefix
}

function folderUrlSegment(segment: string): string {
  const param = segment.match(/^\[(.+)\]$/)
  return param ? `$${param[1]}` : segment
}

function pagePathSegments(file: PageFile): string[] {
  const dir = file.dir.map(folderUrlSegment)
  const last = file.kind === 'index' ? '' : file.param ? `$${file.param}` : file.name || ''
  return [...dir, last].filter(Boolean)
}

function dropConflictingPages(files: PageFile[]): { files: PageFile[]; warnings: string[] } {
  const folders = new Set<string>()
  for (const file of files) {
    if (file.dir.length) folders.add(file.dir.join('/'))
  }
  const warnings: string[] = []
  const kept: PageFile[] = []
  for (const file of files) {
    if (file.kind === 'page') {
      const leaf = file.param ? `[${file.param}]` : file.name
      if (leaf) {
        const folderKey = [...file.dir, leaf].join('/')
        if (folders.has(folderKey)) {
          warnings.push(`app/pages/${file.rel} ignored; app/pages/${folderKey}/ already defines that path`)
          continue
        }
      }
    }
    kept.push(file)
  }
  return { files: kept, warnings }
}

function ensureNode(root: DirNode, dir: string[]): DirNode {
  let node = root
  const walked: string[] = []
  for (const segment of dir) {
    walked.push(segment)
    const key = walked.join('/')
    let child = node.children.get(segment)
    if (!child) {
      child = { key, dir: [...walked], pages: [], children: new Map() }
      node.children.set(segment, child)
    }
    node = child
  }
  return node
}

function buildTree(files: PageFile[]): DirNode {
  const root: DirNode = { key: '', dir: [], pages: [], children: new Map() }
  for (const file of files) {
    const node = ensureNode(root, file.dir)
    if (file.kind === 'layout') node.layout = file
    else if (file.kind === 'index') node.index = file
    else if (file.kind === 'error') node.error = file
    else if (file.kind === 'pending') node.pending = file
    else node.pages.push(file)
  }
  return root
}

function emitRouter(root: string, files: PageFile[], htmlTemplate = ''): string {
  const tree = buildTree(files)
  const imports: string[] = [
    `import { createRootRoute, createRoute, createRouter, Outlet, useParams } from '@tanstack/react-router'`,
    `import type { AnyHistory, AnyRoute } from '@tanstack/react-router'`,
    `import type { ComponentType, ReactNode } from 'react'`,
  ]
  const importNames = new Map<string, string>()

  function addImport(file: PageFile, hint: string): string {
    const existing = importNames.get(file.abs)
    if (existing) return existing
    const name = ident(hint, [...file.dir, file.kind, file.param || file.name || 'x'])
    imports.push(`import ${name} from '${importFromGenerated(root, file.abs)}'`)
    importNames.set(file.abs, name)
    return name
  }

  const body: string[] = [
    `function asLayout(Layout: ComponentType<{ children: ReactNode } & Record<string, string>>) {`,
    `  return function LayoutRoute() {`,
    `    const params = useParams({ strict: false }) as Record<string, string>`,
    `    return <Layout {...params}><Outlet /></Layout>`,
    `  }`,
    `}`,
    ``,
    `function withParams(Page: ComponentType<Record<string, string>>) {`,
    `  return function PageWithParams() {`,
    `    const params = useParams({ strict: false }) as Record<string, string>`,
    `    return <Page {...params} />`,
    `  }`,
    `}`,
    ``,
  ]

  if (tree.layout) {
    const name = addImport(tree.layout, 'Layout')
    const extra: string[] = [`  component: asLayout(${name}),`]
    if (tree.error) extra.push(`  errorComponent: ${addImport(tree.error, 'Error')},`)
    if (tree.pending) extra.push(`  pendingComponent: ${addImport(tree.pending, 'Pending')},`)
    body.push(`const rootRoute = createRootRoute({`, ...extra, `})`, ``)
  } else {
    body.push(
      `function DefaultRoot() { return <Outlet /> }`,
      `const rootRoute = createRootRoute({ component: DefaultRoot })`,
      ``,
    )
  }

  const childExprs: string[] = []

  function emitDir(node: DirNode, parentVar: string, urlSegment: string, isRoot: boolean) {
    const routeVar = isRoot ? parentVar : ident('route', node.dir)
    const nestedChildren: string[] = []

    if (!isRoot) {
      const routePath = folderUrlSegment(urlSegment)
      const opts: string[] = [
        `  getParentRoute: () => ${parentVar},`,
        `  path: ${JSON.stringify(routePath)},`,
      ]
      if (node.layout) {
        opts.push(`  component: asLayout(${addImport(node.layout, 'Layout')}),`)
      } else {
        opts.push(`  component: () => <Outlet />,`)
      }
      if (node.error) opts.push(`  errorComponent: ${addImport(node.error, 'Error')},`)
      if (node.pending) opts.push(`  pendingComponent: ${addImport(node.pending, 'Pending')},`)
      body.push(`const ${routeVar} = createRoute({`, ...opts, `})`, ``)
    }

    if (node.index) {
      const indexVar = ident('index', node.dir)
      body.push(
        `const ${indexVar} = createRoute({`,
        `  getParentRoute: () => ${routeVar},`,
        `  path: '/',`,
        `  component: withParams(${addImport(node.index, 'Index')}),`,
        `})`,
        ``,
      )
      nestedChildren.push(indexVar)
    }

    for (const page of node.pages) {
      const pageVar = ident('page', [...page.dir, page.param || page.name || 'p'])
      const segment = page.param ? `$${page.param}` : page.name
      body.push(
        `const ${pageVar} = createRoute({`,
        `  getParentRoute: () => ${routeVar},`,
        `  path: ${JSON.stringify(segment)},`,
        `  component: withParams(${addImport(page, 'Page')}),`,
        `})`,
        ``,
      )
      nestedChildren.push(pageVar)
    }

    for (const [segment, child] of node.children) {
      emitDir(child, routeVar, segment, false)
      nestedChildren.push(ident('route', child.dir))
    }

    if (!isRoot) {
      if (nestedChildren.length) {
        body.push(`const ${routeVar}_tree = ${routeVar}.addChildren([${nestedChildren.join(', ')}])`, ``)
      } else {
        body.push(`const ${routeVar}_tree = ${routeVar}`, ``)
      }
    } else {
      childExprs.push(...nestedChildren)
    }
  }

  emitDir(tree, 'rootRoute', '', true)

  const assembled = childExprs.map((name) => {
    const withTree = `${name}_tree`
    return body.some((line) => line.includes(`const ${withTree}`)) ? withTree : name
  })

  body.push(
    `const routeTree = rootRoute.addChildren([${assembled.join(', ')}])`,
    ``,
    `export function getRouter(history: AnyHistory) {`,
    `  return createRouter({`,
    `    routeTree: routeTree as AnyRoute,`,
    `    history,`,
    `    defaultPreload: 'intent',`,
    `  })`,
    `}`,
    ``,
    `export { routeTree }`,
    `export const INDEX_HTML = ${JSON.stringify(htmlTemplate)}`,
  )

  return `${imports.join('\n')}\n\n${body.join('\n')}\n`
}

function emitClient(): string {
  return `import { hydrateRoot, createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserHistory } from '@tanstack/react-router'
import { getRouter } from './router'

const router = getRouter(createBrowserHistory())
const el = document.getElementById('root')

if (!el) {
  throw new Error('Pubflow Native: #root was not found in index.html')
}

void router.load().then(() => {
  if (el.hasChildNodes()) {
    hydrateRoot(el, <RouterProvider router={router} />)
  } else {
    createRoot(el).render(<RouterProvider router={router} />)
  }
})
`
}

function emitServer(root: string, htmlTemplate: string): string {
  const server = customServerPath(root)
  if (server) {
    return `export { default } from '${importFromGenerated(root, server)}'
export const INDEX_HTML = ${JSON.stringify(htmlTemplate)}
`
  }

  return `import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createActionsApp } from '@pubflow/native/actions'
import { createApiApp } from '@pubflow/native/api'
import { createPageHandler } from '@pubflow/native/pages'
import { getRouter } from './router'

export const INDEX_HTML = ${JSON.stringify(htmlTemplate)}

const apiModules = import.meta.glob('../../app/api/**/*.{ts,js}', { eager: true }) as Record<string, { default?: unknown }>
const actionModules = import.meta.glob('../../app/actions/**/*.{ts,js}', { eager: true }) as Record<string, Record<string, unknown>>

const app = new Hono()
app.use('*', logger())
app.use('*', cors())
const api = createApiApp(apiModules)
api.route('/actions', createActionsApp(actionModules))
app.route('/api', api)
app.get('/health', (c) => c.json({ ok: true, name: 'pubflow-native' }))
app.get('/openapi.json', (c) => c.json({
  openapi: '3.0.0',
  info: { title: 'Pubflow Native', version: '0.1.0' },
  paths: {},
}))
app.all('*', createPageHandler(getRouter, INDEX_HTML))

export default app
`
}

function collectActionIds(root: string): string[] {
  const ids: string[] = []
  for (const file of scanActions(root)) {
    if (file.isMiddleware || file.isAuth) continue
    const source = fs.readFileSync(file.abs, 'utf8')
    for (const name of listExportedFunctions(source)) {
      ids.push(actionId(file.rel, name))
    }
  }
  return [...new Set(ids)]
}

function emitTypes(root: string, pageFiles: PageFile[]): string {
  const pages = dropConflictingPages(pageFiles).files
  const apis = preferFolderMounts(
    scanApi(root)
      .filter((file) => !file.isMiddleware)
      .map((file) => ({ ...file, rank: file.rank || 0 })),
    () => {},
  )
  const actionIds = collectActionIds(root)
  const routes = pages
    .filter((file) => file.kind === 'index' || file.kind === 'page')
    .map((file) => '/' + pagePathSegments(file).join('/'))
  const unique = [...new Set(routes.length ? routes : ['/'])]
  const apiMounts = [...new Set(apis.map((a) => '/api' + (a.mount === '/' ? '' : a.mount)))]
  return `/* Generated by @pubflow/native — do not edit */
export type NativePagePath = ${unique.map((r) => JSON.stringify(r)).join(' | ')}
export type NativeApiMount = ${
    apiMounts.length ? apiMounts.map((a) => JSON.stringify(a)).join(' | ') : 'never'
  }
export type NativeActionId = ${
    actionIds.length ? actionIds.map((id) => JSON.stringify(id)).join(' | ') : 'never'
  }
`
}

function emitGitignore(): string {
  return `# Generated by @pubflow/native. Safe to delete; recreated on next dev/build.
*
`
}

export type CodegenResult = {
  dir: string
  files: string[]
  customServer: boolean
  warnings: string[]
}

export function generateNative(root: string, htmlTemplate = ''): CodegenResult {
  const dir = generatedDir(root)
  fs.mkdirSync(dir, { recursive: true })
  const scanned = scanPages(root)
  const { files: pages, warnings } = dropConflictingPages(scanned)
  const apiWarnings: string[] = []
  preferFolderMounts(
    scanApi(root)
      .filter((file) => !file.isMiddleware)
      .map((file) => ({ ...file, rank: file.rank || 0 })),
    (dropped, kept) => {
      apiWarnings.push(
        `app/api/${dropped.rel} ignored; app/api/${kept.rel} already defines /api${kept.mount === '/' ? '' : kept.mount}`,
      )
    },
  )
  const allWarnings = [...warnings, ...apiWarnings]
  const files = {
    'router.tsx': emitRouter(root, pages, htmlTemplate),
    'client.tsx': emitClient(),
    'server.ts': emitServer(root, htmlTemplate),
    'types.d.ts': emitTypes(root, pages),
    '.gitignore': emitGitignore(),
  }
  for (const [name, source] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), source)
  }
  return {
    dir,
    files: Object.keys(files).map((name) => toPosix(path.join(dir, name))),
    customServer: hasCustomServer(root),
    warnings: allWarnings,
  }
}
