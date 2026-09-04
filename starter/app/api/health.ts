import { Hono } from 'hono'

const health = new Hono()

health.get('/', (c) => c.json({ ok: true, service: 'pubflow-native' }))

export default health
