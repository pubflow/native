import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import app from 'virtual:pubflow-native/server'

const port = Number(process.env.PORT || 3000)
const server = new Hono()

server.use('/assets/*', serveStatic({ root: './dist/client' }))
server.use('/favicon.ico', serveStatic({ root: './dist/client' }))
server.route('/', app)

serve({ fetch: server.fetch, port }, () => {
  console.log(`Pubflow Native listening on http://localhost:${port}`)
})
