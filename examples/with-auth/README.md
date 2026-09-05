# with-auth

This folder is **not** a Native starter. Do not clone it.

Login, dashboard, and `requireAuth()` live on the **Default** app (`starter/`). Flowless core is the source of truth (login, sessions, `POST /auth/bridge/validate`). The browser talks to Flowless like create-flowfull-client: URL and Bridge are public.

```bash
npx degit pubflow/native/starter my-app
cd my-app
cp .env.example .env
bun run dev
```

Or `pubflow create native my-app`.

```
PUBFLOW_PUBLIC_FLOWLESS_URL=http://localhost:8787
PUBFLOW_PUBLIC_BRIDGE_SECRET=<same string Flowless expects>
FLOWLESS_URL=http://localhost:8787
BRIDGE_SECRET=<same string>
```

`BRIDGE_VALIDATION_SECRET` is an alias of `BRIDGE_SECRET`. `DATABASE_URL` is the only secret.
