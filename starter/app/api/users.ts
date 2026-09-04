import { Hono } from 'hono'
import { requireAuth } from '@/lib/auth'

const users = new Hono()

users.get('/', requireAuth(), (c) => c.json({ user: c.get('session') }))

export default users
