# Data and env

Two data modes:

1. **Same process (default)** — page loaders and the browser call `/api/*` and `POST /api/actions/*` on this app.
2. **Remote Flowfull** — `pubflow.config.ts` / env can point `FLOWFULL_API_URL` at Go/Python/another Node API. Local `/api` can stay a BFF.

Rules:

- Server env is **normal**: `DATABASE_URL`, `FLOWLESS_URL`, `BRIDGE_VALIDATION_SECRET`. No `PUBFLOW_` prefix. Hosts (Neon, Coolify, Wrangler) already expect these names.
- Never `VITE_DATABASE_URL` or `PUBFLOW_PUBLIC_DATABASE_URL`.
- Client env is a whitelist: `PUBFLOW_PUBLIC_*` or `VITE_*`. `publicEnv('FLOWLESS_URL')` in `app/lib/pubflow-config.ts` reads both.
