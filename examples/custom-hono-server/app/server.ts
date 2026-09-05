import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { pages } from '@pubflow/native/pages'
import { apiFromDir } from '@pubflow/native/api'
import { actionsFromDir } from '@pubflow/native/actions'
import hello from './api/hello'

const modules = import.meta.glob('./api/**/*.{ts,js}', { eager: true })
const actionModules = import.meta.glob('./actions/**/*.{ts,js}', { eager: true })

const app = new Hono()
app.use('*', logger())
app.use('*', cors())
const api = apiFromDir(modules)
api.route('/actions', actionsFromDir(actionModules))
app.route('/api/hello', hello)
app.route('/api', api)
app.get('/rpc/ping', (c) => c.json({ pong: true }))
app.all('*', pages())

export default app
