# API

Each `app/api/**/*.ts` file is a real Hono app. The glob mounts `export default` at `/api/<path>`.

```ts
// app/api/users.ts → /api/users
import { Hono } from 'hono'
import { requireAuth } from '@/lib/auth'

const users = new Hono()
users.get('/', requireAuth(), (c) => c.json({ user: c.get('session') }))
export default users
```

## Control layers

0. **Convention** — files only. No root Hono in your repo.
1. **`app/api/_middleware.ts`** — Hono middleware for `/api/*`.
2. **`app/server.ts`** — if this file exists, it **replaces** the generated handler.

```ts
import { Hono } from 'hono'
import { pages } from '@pubflow/native/pages'
import { apiFromDir } from '@pubflow/native/api'
import users from './api/users'

const modules = import.meta.glob('./api/**/*.{ts,js}', { eager: true })
const app = new Hono()
app.route('/api/users', users)
app.route('/api', apiFromDir(modules))
app.all('*', pages())
export default app
```

`/health` and `/openapi.json` are registered on the generated server. Custom servers can add their own.
