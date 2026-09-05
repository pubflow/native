import app from 'virtual:pubflow-native/server'

type BunFile = Blob & { exists: () => Promise<boolean> }

declare const Bun: {
  serve: (opts: {
    port: number
    fetch: (req: Request) => Response | Promise<Response>
  }) => unknown
  file: (path: string) => BunFile
}

const port = Number(process.env.PORT || 3000)
const clientRoot = './dist/client'

function safeAssetPath(pathname: string): string | null {
  if (pathname.includes('..') || pathname.includes('\\')) return null
  if (pathname.startsWith('/assets/') || pathname === '/favicon.ico') return clientRoot + pathname
  return null
}

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url)
    const asset = safeAssetPath(url.pathname)
    if (asset) {
      const file = Bun.file(asset)
      if (await file.exists()) return new Response(file)
    }
    return app.fetch(req)
  },
})

console.log(`Pubflow Native listening on http://localhost:${port}`)
