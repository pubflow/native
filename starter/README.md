# Pubflow Native starter

React pages (`app/pages`) and Hono APIs (`app/api`) in one process. Auth is client-side with `@pubflow/react`, the same contract as the Next and TanStack starters.

```bash
bun install
cp .env.example .env
bun run dev
```

| Script | What it does |
| --- | --- |
| `bun run dev` | Vite + Hono on port 3000 |
| `bun run build` | Client bundle + SSR / Worker bundle |
| `bun run start` | Node production server |
| `bun run dev:cf` | Wrangler against the built Worker |
| `bun run deploy:cf` | Cloudflare Workers deploy |

`DATABASE_URL` and `BRIDGE_VALIDATION_SECRET` belong in server env only. The browser uses `PUBFLOW_PUBLIC_FLOWLESS_URL` / `PUBFLOW_PUBLIC_BRIDGE_SECRET` (or the `VITE_*` aliases).
