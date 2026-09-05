# Auth

Login UI stays in `@pubflow/react`. Server checks live in **`@pubflow/native/auth`** (optional subpath — not imported by the Vite plugin or the client bundle). Native does not import `@pubflow/react`.

```ts
import { requireAuth, requireRole, createAuth } from '@pubflow/native/auth'
```

The starter re-exports those from `app/lib/auth.ts`. `app/actions/_auth.ts` re-exports `requireAuth` so Actions can wrap `export const auth = true`.

| Intent | Action file | Hono |
|---|---|---|
| Public | omit `auth` and `allowedTypes` | no middleware |
| Any signed-in user | `export const auth = true` or `allowedTypes = 'any'` | `requireAuth()` |
| Roles | `allowedTypes = ['admin', 'editor']` | `requireRole('admin', 'editor')` |

`any`, `authenticated`, and `*` all mean **any session**. They do **not** mean public. `authenticated` remains an alias for `@pubflow/react` `useAuthGuard`.

`requireAuth()` and `requireRole(...)` share one Flowless `POST /auth/bridge/validate`. If `c.get('session')` is already set, the validator is skipped.

```ts
requireAuth()
requireRole('admin', 'editor')
users.get('/', requireAuth(), requireRole('admin'), handler) // still one validate
```

`requireAuth({ types: 'admin,editor' })` still works (maps to `requireRole`). Prefer rest args.

Custom adapter (Clerk, your own JWT):

```ts
export const { requireAuth, requireRole } = createAuth(async (sessionId) => {
  return { user_id: '...', user_type: 'admin' }
})
```

Pages: `AuthGuard` `allowedTypes` is UI only — **POST still needs server checks**.

Env: browser `PUBFLOW_PUBLIC_FLOWLESS_URL` / `PUBFLOW_PUBLIC_BRIDGE_SECRET`. Server `FLOWLESS_URL` + `BRIDGE_VALIDATION_SECRET`. Header `X-Bridge-Secret` on `POST /auth/bridge/validate`.
