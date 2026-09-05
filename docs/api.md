# API

Each `app/api/**/*.ts` file is a real Hono app. Native mounts `export default` at `/api/<path>`. You write the verbs (`.get`, `.post`, …). A JSON export or `export async function GET` does not mount.

```ts
// app/api/users.ts → /api/users
import { Hono } from 'hono'
import { requireAuth, requireRole } from '@/lib/auth'

const users = new Hono()
users.get('/', requireAuth(), (c) => c.json({ user: c.get('session') }))
users.get('/:id', requireAuth(), (c) => c.json({ id: c.req.param('id') }))
users.get('/admin', requireRole('admin', 'editor'), (c) => c.json({ user: c.get('session') }))
export default users
```

`requireAuth` / `requireRole` come from `@pubflow/native/auth` (the starter re-exports them in `app/lib/auth.ts`). See [Auth](./auth.md).

## Folders and `index`

| File | Mount |
| --- | --- |
| `app/api/products.ts` | `/api/products` |
| `app/api/products/index.ts` | `/api/products` (same — pick one) |
| `app/api/products/list.ts` | `/api/products/list` |
| `app/api/v1/products.ts` | `/api/v1/products` |
| `app/api/_middleware.ts` | all `/api/*` |
| `app/api/products/_middleware.ts` | `/api/products/*` |

If `products.ts` and `products/index.ts` both exist, **the folder wins**. `products.ts` plus `products/list.ts` is not a conflict (different mounts).

Keep the HTTP file thin. Domain code goes in `app/lib` — see [Backend](./backend.md). Files and folders that start with `_` are **not** mounted, except `_middleware.ts`. Do not put `queries.ts` or tests under `app/api/` unless they export a Hono app you want as a route.

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

## Actions

UI mutations that should not live in a page go in `app/actions`. They are still Hono: `POST /api/actions/<id>` with JSON. See [Actions](./actions.md). Do not add a second protocol (gRPC, RSC Flight) for the browser.
