# Data and env

Two data modes:

1. **Same process (default)** — pages `fetch` `/api/*` and call `POST /api/actions/*` on this app. There is no page loader: `[id]` is a URL param (props or `usePathParams`); data comes from the API or an Action.
2. **Remote Flowfull** — `pubflow.config.ts` / env can point `FLOWFULL_API_URL` at Go/Python/another Node API. Local `/api` can stay a BFF.

Rules:

- Client env is a whitelist: `PUBFLOW_PUBLIC_*` or `VITE_*`. `API_BASE_URL` is the Flowless origin (`bootEnv('FLOWLESS_URL')`). Worker `PUBFLOW_PUBLIC_FLOWLESS_URL` is enough: SSR injects `window.__PUBFLOW_PUBLIC__` so the Google href is not stuck on Vite build-time / localhost. Same idea as create-flowfull-client `VITE_API_BASE_URL` / `VITE_BRIDGE_SECRET` — public config, not secrets. Flowless core validates sessions.
- Server `requireAuth()` uses the same strings: unprefixed `FLOWLESS_URL` / `BRIDGE_SECRET` if set, otherwise `PUBFLOW_PUBLIC_*` / `VITE_*`. Unprefixed names are an optional override so Vite never inlines them next to `DATABASE_URL`. `BRIDGE_VALIDATION_SECRET` still wins. `requireAuth()` POSTs `/auth/bridge/validate`.
- `DATABASE_URL` is the only database secret. Never `VITE_DATABASE_URL` or `PUBFLOW_PUBLIC_DATABASE_URL`. Hosts (Neon, Coolify, Wrangler) already expect that name. Put the Neon/PlanetScale/Turso string in `DATABASE_URL` — see [Env](./env.md) and [Database](./db.md). Postgres/MySQL on Workers: [Hyperdrive](./hyperdrive.md). The client build fails if a page imports `getDb()`.

