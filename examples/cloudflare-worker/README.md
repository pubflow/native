# Cloudflare Worker

This folder is **not** a standalone Native app. It documents the Cloudflare path already in the starter (`wrangler.jsonc` + `bun run deploy:cf`). The `wrangler.jsonc` here only points at `starter/dist` after you build the starter.

```bash
cd ../../starter
bun run build
bun run dev:cf
bun run deploy:cf
```

One Worker is pages + API. Same idea as flowfull-node `src/worker.ts`. Secrets (`DATABASE_URL`, `BRIDGE_VALIDATION_SECRET`) go in `wrangler secret put`, not `VITE_*` or `PUBFLOW_PUBLIC_*`.
