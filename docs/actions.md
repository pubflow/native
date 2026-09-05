# Pubflow Actions

Pubflow Actions are **typed functions in `app/actions` that the UI calls with `POST` JSON** to the same Hono process. They are not React Server Components, not `'use server'`, and not gRPC.

```
app/actions/ping.ts              → POST /api/actions/ping
app/actions/posts/createPost.ts  → POST /api/actions/posts.createPost
app/actions/posts/_middleware.ts → folder middleware
app/actions/_auth.ts             → optional requireAuth adapter
```

`app/actions/posts/index.ts` exporting `createPost` becomes `posts.index.createPost` — the `index` segment is kept. Prefer a file named after the function.

```ts
import type { ActionContext } from '@pubflow/native/actions'

export const auth = true
// or: export const allowedTypes = 'any'
// or: export const allowedTypes = ['admin', 'editor']

export async function createPost(input: { title: string }, _ctx: ActionContext) {
  return { id: crypto.randomUUID(), title: input.title }
}
```

```ts
import { createPost } from '@/actions/posts/createPost'
await createPost({ title: 'Hello' })
```

The client never receives the function body. SSR keeps the real module (do not call actions during render).

## Wire

- Body `{ args: [...] }` → `{ result }`
- Session: `X-Session-ID` from `localStorage` (`pubflow_session_id`) plus `credentials: 'include'`
- Mounted **under `/api`**, so `app/api/_middleware.ts` runs too
- `auth: true` or `allowedTypes: 'any'` → any signed-in user (401 without session)
- `allowedTypes: ['admin', 'editor']` → 403 if `user_type` does not match
- No flags → public
- Skip exporting `auth`, `allowedTypes`, or `default` as callable functions

`app/actions/_auth.ts` should re-export `requireAuth` from `@pubflow/native/auth` (or `createAuth` for a custom validator). Native does not import `@pubflow/react`.

## HTTP, not gRPC

The UI path is same-origin `POST /api/actions/<id>`. That reuses CORS, cookies, Workers, and `X-Session-ID` on one isolate. gRPC (or Hono RPC / `hc`) can sit **behind** Native later if another service talks to it — it is not faster for the browser talking to this process.

## Custom `app/server.ts`

```ts
import { actionsFromDir } from '@pubflow/native/actions'
import { apiFromDir } from '@pubflow/native/api'

const api = apiFromDir(import.meta.glob('./api/**/*.{ts,js}', { eager: true }))
api.route('/actions', actionsFromDir(import.meta.glob('./actions/**/*.{ts,js}', { eager: true })))
app.route('/api', api)
```
