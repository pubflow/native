# Deploy

Same runtime matrix as flowfull-node. Cloudflare is the first-class path. There is no OpenNext and no Nitro. One Worker is the whole app.

| Target | Entrypoint | Commands | Notes |
| --- | --- | --- | --- |
| Bun / Node | `dist/server/node.js` | `bun run build`, `bun run start` | PostgreSQL, MySQL, LibSQL, Neon, PlanetScale |
| Cloudflare Workers | `dist/server/worker.js` | `bun run dev:cf`, `bun run deploy:cf` | D1, LibSQL, Neon HTTP, PlanetScale. `nodejs_compat`. Buffer SSR if streaming fails. |
| Deno | same Hono `app.fetch` | `Deno.serve` around the SSR app | Prefer HTTP database drivers |

`wrangler.jsonc` in the starter:

- `main`: `dist/server/worker.js`
- `assets.directory`: `dist/client`
- `run_worker_first`: true so HTML is SSR, not a static `index.html` SPA fallback
- Secrets: `wrangler secret put DATABASE_URL`, `BRIDGE_VALIDATION_SECRET`

Coolify: build command `bun run build`, start `bun run start`, or deploy the Worker with Wrangler.
