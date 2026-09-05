# Data and env

Two data modes:

1. **Same process (default)** — page loaders and the browser call `/api/*` and `POST /api/actions/*` on this app.
2. **Remote Flowfull** — `pubflow.config.ts` / env can point `FLOWFULL_API_URL` at Go/Python/another Node API. Local `/api` can stay a BFF.

Rules:

- Client env is a whitelist: `PUBFLOW_PUBLIC_*` or `VITE_*`. `publicEnv('FLOWLESS_URL')` / `publicEnv('BRIDGE_SECRET')` in `app/lib/pubflow-config.ts` read both. Same idea as create-flowfull-client `VITE_API_BASE_URL` / `VITE_BRIDGE_SECRET` — public config, not secrets. Flowless core validates sessions.
- Server uses the **same** Flowless URL and Bridge string without a prefix (`FLOWLESS_URL`, `BRIDGE_SECRET` or `BRIDGE_VALIDATION_SECRET`) so Vite never inlines them next to `DATABASE_URL`. `requireAuth()` POSTs `/auth/bridge/validate`.
- `DATABASE_URL` is the only secret. Never `VITE_DATABASE_URL` or `PUBFLOW_PUBLIC_DATABASE_URL`. Hosts (Neon, Coolify, Wrangler) already expect that name.
