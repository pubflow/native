# Deploy

Cloudflare is the isolate path. Node, Bun, and Docker are the process path. There is no OpenNext and no Nitro. One `vite build && vite build --ssr` emits every entry; pick the file your host runs.

| Target | Entrypoint | Commands | Notes |
| --- | --- | --- | --- |
| Node | `dist/server/node.js` | `bun run build`, `bun run start` | Coolify, any VPS with Node |
| Bun | `dist/server/bun.js` | `bun run build`, `bun run start:bun` | `Bun.serve`, same `PORT` |
| Docker | image from `starter/Dockerfile` | `docker build -t app .` then `docker run -p 3000:3000 app` | Bun runtime. `Dockerfile.node` if the host is Node-only |
| Nixpacks | `nixpacks.toml` | Coolify / Railway auto-detect | Bun install + `bun run build` + `bun dist/server/bun.js` |
| Cloudflare Workers | `dist/server/worker.js` | `bun run deploy:cf` | D1, LibSQL, Neon HTTP. `nodejs_compat` for `process.env` |

`wrangler.jsonc` in the starter:

- `main`: `dist/server/worker.js`
- `assets.directory`: `dist/client`
- `run_worker_first`: true so HTML is SSR, not a static `index.html` SPA fallback
- Secrets: `wrangler secret put DATABASE_URL`, `BRIDGE_VALIDATION_SECRET`

Coolify: Nixpacks (commit `nixpacks.toml` + `bun.lock`) or the Dockerfile. Railway: same Nixpacks file. Do not leave start as `node dist/server/node.js` on a Bun-only image.
