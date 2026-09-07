import app from 'virtual:pubflow-native/server'
import { bindWorkerEnv } from './db.ts'

type AssetEnv = {
  ASSETS?: { fetch: typeof fetch }
}

export default {
  async fetch(request: Request, env: AssetEnv): Promise<Response> {
    bindWorkerEnv(env)
    const url = new URL(request.url)
    const looksStatic = url.pathname.startsWith('/assets/') || /\.[a-zA-Z0-9]+$/.test(url.pathname)
    if (looksStatic && env.ASSETS) {
      const asset = await env.ASSETS.fetch(request)
      if (asset.status !== 404) return asset
    }
    return app.fetch(request, env)
  },
}
