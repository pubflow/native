import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin, PluginOption, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { emitActionStub, listExportedFunctions } from './actions.ts'
import { generateNative } from './codegen.ts'
import {
  databaseUrlFromEnv,
  HYPERDRIVE_HINT,
  shouldWarnHyperdrive,
  wranglerConfigSource,
} from './hyperdrive-hint.ts'
import { guidedClientImportError } from './client-guard.ts'
import { generatedDir, toPosix } from './scan.ts'

export type NativeViteOptions = {
  /** Project root. Defaults to Vite config root. */
  root?: string
}

const VIRTUAL = {
  router: 'virtual:pubflow-native/router',
  server: 'virtual:pubflow-native/server',
  client: 'virtual:pubflow-native/client',
}

const CLIENT_DEV_SCRIPT = '/.pubflow/generated/client.tsx'
const CLIENT_BUILD_SCRIPT = '/assets/client.js'

const OPTIONAL_SSR_EXTERNALS = [
  'ioredis',
  'redis',
  'nodemailer',
  'kysely',
  'pg',
  'mysql2',
  '@libsql/client',
  '@libsql/kysely-libsql',
]

function resolveEntry(libraryRoot: string, name: string): string {
  const js = path.resolve(libraryRoot, `${name}.js`)
  if (fs.existsSync(js)) return js
  return path.resolve(libraryRoot, `${name}.ts`)
}

function loadHtml(root: string, builtFirst = false): string {
  const built = path.join(root, 'dist', 'client', 'index.html')
  const src = path.join(root, 'index.html')
  if (builtFirst && fs.existsSync(built)) return fs.readFileSync(built, 'utf8')
  if (fs.existsSync(src)) return fs.readFileSync(src, 'utf8')
  if (fs.existsSync(built)) return fs.readFileSync(built, 'utf8')
  return ''
}

function isViteInternal(url = ''): boolean {
  const pathname = url.split('?')[0]
  if (
    pathname.startsWith('/@') ||
    pathname.startsWith('/node_modules') ||
    pathname.startsWith('/.vite') ||
    pathname.startsWith('/__vite') ||
    pathname.startsWith('/.pubflow/') ||
    pathname.includes('/@fs/') ||
    pathname.includes('/@id/')
  ) {
    return true
  }
  return /\.(css|js|mjs|cjs|ts|tsx|jsx|mts|cts|map|json|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|eot|txt|wasm|mp4|webm)(\?|$)/i.test(
    pathname,
  )
}

function actionRelFromId(id: string, root: string): string | null {
  const file = toPosix(path.resolve(id.split('?')[0]))
  const actionsRoot = toPosix(path.resolve(root, 'app', 'actions'))
  if (file !== actionsRoot && !file.startsWith(`${actionsRoot}/`)) return null
  if (!/\.(ts|js)$/.test(file) || file.endsWith('.d.ts')) return null
  return file.slice(actionsRoot.length + 1)
}

function nativeServerGuardPlugin(options: NativeViteOptions = {}): Plugin {
  let root = options.root || process.cwd()
  return {
    name: 'pubflow-native-server-guard',
    enforce: 'pre',
    configResolved(config) {
      root = options.root || config.root
    },
    resolveId(id, importer, opts) {
      if (opts?.ssr || !importer) return null
      const message = guidedClientImportError({ source: id, importer, root })
      if (message) throw new Error(message)
      return null
    },
  }
}

function nativeActionsPlugin(options: NativeViteOptions = {}): Plugin {
  let root = options.root || process.cwd()
  return {
    name: 'pubflow-native-actions',
    enforce: 'pre',
    configResolved(config) {
      root = options.root || config.root
    },
    transform(code, id, opts) {
      if (opts?.ssr) return null
      const rel = actionRelFromId(id, root)
      if (!rel) return null
      const base = rel.replace(/\.(ts|js)$/, '')
      const last = base.split('/').pop()
      if (last === '_middleware' || last === '_auth') {
        return { code: 'export {}\n', map: null }
      }
      return { code: emitActionStub(rel, listExportedFunctions(code)), map: null }
    },
  }
}

function nativePlugin(options: NativeViteOptions = {}): Plugin {
  let root = options.root || process.cwd()
  let isSsrBuild = false
  let command: 'build' | 'serve' = 'serve'
  let mode = 'production'
  let hyperdriveHintShown = false

  const regenerate = (html = '') => {
    const result = generateNative(root, html)
    for (const warning of result.warnings) {
      console.warn(`[pubflow-native] ${warning}`)
    }
    return result
  }

  const warnHyperdriveIfNeeded = () => {
    if (hyperdriveHintShown || !isSsrBuild) return
    const loaded = loadEnv(mode, root, '')
    const env = { ...loaded, ...process.env }
    if (
      !shouldWarnHyperdrive({
        isSsrBuild: true,
        wranglerSource: wranglerConfigSource(root),
        databaseUrl: databaseUrlFromEnv(env),
        databaseProvider: env.DATABASE_PROVIDER,
      })
    ) {
      return
    }
    hyperdriveHintShown = true
    console.warn(HYPERDRIVE_HINT)
  }

  return {
    name: 'pubflow-native',
    configResolved(config) {
      root = options.root || config.root
      isSsrBuild = Boolean(config.build.ssr)
      mode = config.mode
      regenerate(isSsrBuild ? loadHtml(root, true) : '')
    },
    config(_config, env) {
      root = options.root || _config.root || root
      command = env.command
      const ssr = env.isSsrBuild
      regenerate(ssr ? loadHtml(root, true) : '')
      const gen = generatedDir(root)
      const libraryRoot = path.dirname(fileURLToPath(import.meta.url))
      const nodeEntry = resolveEntry(libraryRoot, 'node-entry')
      const bunEntry = resolveEntry(libraryRoot, 'bun-entry')
      const workerEntry = resolveEntry(libraryRoot, 'worker-entry')

      return {
        resolve: {
          alias: {
            '@': path.resolve(root, 'app'),
            [VIRTUAL.router]: path.resolve(gen, 'router.tsx'),
            [VIRTUAL.server]: path.resolve(gen, 'server.ts'),
            [VIRTUAL.client]: path.resolve(gen, 'client.tsx'),
          },
        },
        ssr: {
          noExternal: ['@pubflow/native'],
          external: OPTIONAL_SSR_EXTERNALS,
        },
        optimizeDeps: {
          exclude: ['@pubflow/native'],
        },
        server: {
          fs: {
            allow: [root, path.join(root, '.pubflow'), libraryRoot],
          },
        },
        appType: 'custom',
        envPrefix: ['VITE_', 'PUBFLOW_PUBLIC_'],
        build: ssr
          ? {
              ssr: true,
              outDir: 'dist/server',
              copyPublicDir: false,
              emptyOutDir: true,
              rollupOptions: {
                input: {
                  app: path.resolve(gen, 'server.ts'),
                  node: nodeEntry,
                  bun: bunEntry,
                  worker: workerEntry,
                } as Record<string, string>,
                external: OPTIONAL_SSR_EXTERNALS,
                output: {
                  entryFileNames: '[name].js',
                  format: 'es',
                },
              },
            }
          : {
              outDir: 'dist/client',
              emptyOutDir: true,
              rollupOptions: {
                input: {
                  index: path.resolve(root, 'index.html'),
                  client: path.join(gen, 'client.tsx'),
                } as Record<string, string>,
                output: {
                  entryFileNames: (chunk) =>
                    chunk.name === 'client' ? 'assets/client.js' : 'assets/[name]-[hash].js',
                  chunkFileNames: 'assets/[name]-[hash].js',
                  assetFileNames: 'assets/[name]-[hash][extname]',
                },
              },
            },
      }
    },
    resolveId(id) {
      if (OPTIONAL_SSR_EXTERNALS.includes(id)) {
        return { id, external: true }
      }
      if (id === VIRTUAL.router || id === '/@pubflow-native/router.tsx') {
        return path.join(generatedDir(root), 'router.tsx')
      }
      if (id === VIRTUAL.server || id === '/@pubflow-native/server.ts') {
        return path.join(generatedDir(root), 'server.ts')
      }
      if (
        id === VIRTUAL.client ||
        id === '/@pubflow-native/client.tsx' ||
        id === CLIENT_DEV_SCRIPT
      ) {
        return path.join(generatedDir(root), 'client.tsx')
      }
      return null
    },
    configureServer(server: ViteDevServer) {
      regenerate('')
      const watchDirs = [
        path.join(root, 'app', 'pages'),
        path.join(root, 'app', 'api'),
        path.join(root, 'app', 'actions'),
        path.join(root, 'app', 'server.ts'),
        path.join(root, 'index.html'),
        path.join(root, 'pubflow.config.ts'),
      ]
      for (const dir of watchDirs) server.watcher.add(dir)

      server.watcher.on('all', (_event, file) => {
        const posix = file.replace(/\\/g, '/')
        if (
          posix.includes('/app/pages/') ||
          posix.includes('/app/api/') ||
          posix.includes('/app/actions/') ||
          posix.endsWith('/app/server.ts') ||
          posix.endsWith('/index.html')
        ) {
          const result = regenerate('')
          if (!result.changed) return
          const generated = generatedDir(root)
          for (const name of ['server.ts', 'router.tsx', 'client.tsx']) {
            const mods = server.moduleGraph.getModulesByFile(path.join(generated, name))
            if (mods) {
              for (const mod of mods) server.moduleGraph.invalidateModule(mod)
            }
          }
        }
      })

      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (isViteInternal(req.url || '')) {
            next()
            return
          }
          try {
            const { getRequestListener } = await import('@hono/node-server')
            const listener = getRequestListener(async (request) => {
              const mod = await server.ssrLoadModule(path.join(generatedDir(root), 'server.ts'))
              const app = mod.default
              return app.fetch(request, { vite: server })
            })
            await listener(req, res)
          } catch (error) {
            next(error)
          }
        })
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          {
            tag: 'script',
            children:
              'globalThis.process=globalThis.process||{env:{}};globalThis.process.env=globalThis.process.env||{};',
            injectTo: 'head-prepend',
          },
          {
            tag: 'script',
            attrs: {
              type: 'module',
              src: command === 'build' ? CLIENT_BUILD_SCRIPT : CLIENT_DEV_SCRIPT,
            },
            injectTo: 'body',
          },
        ]
      },
    },
    buildStart() {
      regenerate(isSsrBuild ? loadHtml(root, true) : '')
      warnHyperdriveIfNeeded()
    },
  }
}

/**
 * Vite plugins for Pubflow Native. Use with Tailwind in the project config:
 *
 * ```ts
 * plugins: [native(), tailwind()]
 * ```
 */
export default function native(options: NativeViteOptions = {}): PluginOption[] {
  return [nativeServerGuardPlugin(options), nativePlugin(options), nativeActionsPlugin(options), react()]
}

export { native }
