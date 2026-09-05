# Cloudflare Worker

This folder is **not** a Native starter. Do not clone it.

Cloudflare lives on the **Default** app: [`starter/wrangler.jsonc`](../../starter/wrangler.jsonc) (`main: dist/server/worker.js`, assets from `./dist/client`) plus `bun run deploy:cf`. Minimal and Custom Hono have the same local `wrangler.jsonc` in their own folders.

```bash
npx degit pubflow/native/starter my-app
cd my-app
bun install
bun run deploy:cf
```

Or `pubflow create native my-app`.

One Worker is pages + API. `DATABASE_URL` is a secret (`wrangler secret put`). `FLOWLESS_URL` and `BRIDGE_SECRET` (or `BRIDGE_VALIDATION_SECRET`) are normal vars — the same public strings as `PUBFLOW_PUBLIC_FLOWLESS_URL` / `PUBFLOW_PUBLIC_BRIDGE_SECRET` on the client.
