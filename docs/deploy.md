# Deploy

One `vite build && vite build --ssr` emits every entry; pick the file your host runs. Cloudflare is the isolate path. Node, Bun, and Docker are the process path.

| Target | Entrypoint | Commands | Notes |
| --- | --- | --- | --- |
| Node | `dist/server/node.js` | `bun run build`, `bun run start` | Coolify, any VPS with Node |
| Bun | `dist/server/bun.js` | `bun run build`, `bun run start:bun` | `Bun.serve`, same `PORT` |
| Docker | image from `Dockerfile` in the app | `docker build -t app .` then `docker run -p 3000:3000 app` | Bun runtime. `Dockerfile.node` if the host is Node-only |
| Nixpacks | `nixpacks.toml` | Coolify / Railway auto-detect | Bun install + `bun run build` + `bun dist/server/bun.js` |
| Cloudflare Workers | `dist/server/worker.js` | `bun run deploy:cf` | LibSQL, or **Hyperdrive** for Postgres/MySQL (opt-in). D1 is not in `getDb()` yet. `nodejs_compat` for `process.env` |

`wrangler.jsonc` in the app you cloned (Default, Minimal, or Custom Hono) — paths are local `dist/...`, not `examples/cloudflare-worker`:

- `main`: `dist/server/worker.js`
- `assets.directory`: `dist/client`
- `run_worker_first`: true so HTML is SSR, not a static `index.html` SPA fallback
- No database: clone / Deploy to Cloudflare. Do not edit `wrangler.jsonc`.
- Turso: Worker **runtime** secret `DATABASE_URL` (`libsql://...?authToken=`). HTTP. No Hyperdrive. Do not put this in Workers Builds / git CI.
- Postgres / MySQL on Workers: create Hyperdrive, then uncomment the binding — [Hyperdrive](./hyperdrive.md). Not a TCP `pg` pool in the isolate. Node / Bun still use `DATABASE_URL` only.
- Vars (public Flowless URL + bridge string): `PUBFLOW_PUBLIC_FLOWLESS_URL` and `PUBFLOW_PUBLIC_BRIDGE_SECRET` are enough. Unprefixed `FLOWLESS_URL` / `BRIDGE_SECRET` (or `BRIDGE_VALIDATION_SECRET`) are optional runtime overrides.
- `"keep_vars": true` in the app `wrangler.jsonc`: dashboard plaintext Variables survive git/`wrangler deploy`. Secrets already persist. Workers Builds vars are not runtime.

Coolify: Nixpacks (commit `nixpacks.toml` + `bun.lock`) or the Dockerfile. Railway: same Nixpacks file. Do not leave start as `node dist/server/node.js` on a Bun-only image.

## Cloudflare free tier

Limits from [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) (Sep 2026). Worker size is **uncompressed** (`Total Upload` in Wrangler). Gzip is not a limit. Static assets (`dist/client`) are separate (25 MiB per file).

| | Free | Paid |
| --- | --- | --- |
| Worker size | 64 MiB | 64 MiB |
| CPU per HTTP request | 10 ms | 30 s default (up to 5 min) |
| Wall-clock duration (HTTP) | No limit while the client is connected | Same |
| Memory | 128 MB | 128 MB |
| Requests | 100,000 / day | No daily cap |
| Subrequests | 50 / request | 10,000 |
| Startup (global scope) | 1 s | 1 s |

Measured `wrangler deploy --dry-run` on these templates (Worker script only; assets extra). Reproduce: build the app, then `bun scripts/bench-native.ts --sizes`. CI fails if Default exceeds **2.5 MiB** uncompressed, or Minimal / Custom Hono exceed **1.2 MiB**.

| App | Uncompressed | gzip |
| --- | --- | --- |
| Default (`starter/`) | 1.80 MiB | 333 KiB |
| Minimal | 0.86 MiB | 167 KiB |
| Custom Hono | 0.88 MiB | 170 KiB |

All three fit free and paid with a large margin.

**CPU 10 ms is the free-tier constraint, not size.** Cloudflare counts CPU, not waiting on `fetch`, D1, Neon HTTP, LibSQL, or Flowless. `renderToString` of a React page **does** count. Their docs put typical SSR + auth at 10–20 ms. JSON `/api` routes on Minimal usually stay under 10 ms. Default HTML SSR can brush or exceed 10 ms; if it does consistently you get Error 1102 — use Paid (30 s). A 200 ms database round-trip does not spend CPU.

Local CPU (not Cloudflare): `bun scripts/bench-native.ts --cpu` times `renderToString` of a short page vs `JSON.stringify` of a small list (`process.cpuUsage()`). JSON is much cheaper than HTML SSR on the same machine (example on a desktop: ~1.4 ms CPU per render, ~0.02 ms per JSON serialize — your numbers will differ). After `bun run deploy:cf`, `wrangler tail` shows `cpuTime` per request — that is the number that counts toward the 10 ms free-tier limit.

Workers are isolate-based, not a long-lived Node process. Do not open `pg` / `mysql2` / ioredis on every request or load a whole dataset into memory. `getDb()` is a per-isolate singleton. In-memory LRU cache dies when the isolate goes cold. On Cloudflare: **Hyperdrive** for Postgres/MySQL (`getDb()` reads `env.HYPERDRIVE`, pool size 1) or LibSQL — not a Node-style TCP pool. D1 is not wired through `getDb()` yet. Redis / ioredis / nodemailer stay aliased to `optional-node-stub.js` in `wrangler.jsonc` so they are not bundled. `pg` and `mysql2` are real packages when you use Hyperdrive.
