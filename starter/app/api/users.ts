import { Hono } from 'hono'
import { requireAuth, requireRole } from '@/lib/auth'

const users = new Hono()

users.get('/', requireAuth(), (c) => c.json({ user: c.get('session') }))
users.get('/admin', requireRole('admin', 'editor'), (c) => c.json({ user: c.get('session') }))

export default users
