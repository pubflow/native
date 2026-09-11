import app from 'virtual:pubflow-native/server'
import { bindWorkerEnv } from './db.ts'

type AssetEnv = {
  ASSETS?: { fetch: typeof fetch }
}

type WorkerCtx = {
  waitUntil(promise: Promise<unknown>): void
}

export default {
  async fetch(request: Request, env: AssetEnv, ctx?: WorkerCtx): Promise<Response> {
    bindWorkerEnv(env)
    const url = new URL(request.url)
    const looksStatic = url.pathname.startsWith('/assets/') || /\.[a-zA-Z0-9]+$/.test(url.pathname)
    if (looksStatic && env.ASSETS) {
      const asset = await env.ASSETS.fetch(request)
      if (asset.status !== 404) return asset
    }
    return app.fetch(request, env, ctx)
  },
}
