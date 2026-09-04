# Auth

Auth is a **client** concern, same as the Next and TanStack starters. Native does not add cookie sessions, `export const auth = true`, or a Bridge package.

- Login / session: `@pubflow/react` + `@pubflow/core`
- Browser env: `PUBFLOW_PUBLIC_FLOWLESS_URL` and `PUBFLOW_PUBLIC_BRIDGE_SECRET` (or `VITE_FLOWLESS_URL` / `VITE_BRIDGE_SECRET`). Same public-client idea as `NEXT_PUBLIC_BRIDGE_SECRET`.
- Server `requireAuth()` reads normal `FLOWLESS_URL` and `BRIDGE_VALIDATION_SECRET`.
- Same-origin `/api/*` calls send `X-Session-ID`
- Protected Hono routes use `requireAuth()` from the starter (`app/lib/auth.ts`) — not `@pubflow/native-auth`

Flowless canonical for local Bridge: `2/canary/flowless`, `POST /auth/bridge/validate`, header `X-Bridge-Secret`.
