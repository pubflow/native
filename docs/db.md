# Database

`import { getDb, parseDatabaseUrl } from '@pubflow/native/db'`

One `DATABASE_URL`. Empty → do not call `getDb()` (the Default starter still boots).

| URL | Provider |
| --- | --- |
| `postgres://` host `*.neon.tech` | neon |
| `postgres://` / `postgresql://` | postgres |
| `mysql://` host `*.psdb.cloud` | planetscale |
| `mysql://` | mysql |
| `libsql://` / `file:` | turso / libsql |

`DATABASE_PROVIDER=` overrides detection at **runtime** (`postgres`, `mysql`, `neon`, `planetscale`, `libsql` / `turso`). Put it on the Worker (Settings → Variables and Secrets) if you need it — not in Workers Builds / git CI. The URL already selects the driver (`libsql://` → Turso). Do not add a build-time `DATABASE_TYPE`.

Turso: put `authToken` (or `token` / `auth_token`) on the URL query. Native strips it before connecting. `TURSO_AUTH_TOKEN` is a code fallback — keep it out of `.env.example`.

The Default starter installs `kysely`, `@libsql/client`, `@libsql/kysely-libsql`, `pg`, and `mysql2`. Minimal does not. On a **Cloudflare Worker**, Native bundles Turso HTTP (`kysely` + `@libsql/client/web`). `pg` / `mysql2` stay Node-only unless you add Hyperdrive. Do not ship the native `libsql` napi binary to Workerd.

Default starter re-exports from `app/lib/db.ts`. There is **no** local users table — identity stays in Flowless.

## Node / Bun / Docker

`postgres://` and `mysql://` (including remote RDS, Neon, PlanetScale) use a normal `pg` / `mysql2` pool:

```ts
const db = await getDb()
await db.selectFrom('products').selectAll().execute()
```

## Cloudflare Workers

A Worker isolate is not a long-lived Node process. Do **not** open a big TCP pool on every request.

| Target | How |
| --- | --- |
| Nothing | Clone / Deploy to Cloudflare. Do not edit `wrangler.jsonc`. |
| Turso / LibSQL (default on Workers) | Runtime secret `DATABASE_URL` (`libsql://…`) plus `TURSO_AUTH_TOKEN` if the token is not on the URL. HTTP via `@libsql/client/web`. **No Hyperdrive.** Not a git Builds variable. |
| Postgres or MySQL (RDS, Cloud SQL, Neon, PlanetScale, a VPS, …) | **Hyperdrive** (opt-in) — Cloudflare pools at the edge. Native uses `pg` / `mysql2` with `max: 1` / `connectionLimit: 1`. See [Hyperdrive](./hyperdrive.md). |
| D1 | Not wired through `getDb()` yet. |

Hyperdrive is **not** auto-provisioned. Wrangler can auto-create KV / R2 / D1 / Queues; Hyperdrive needs your connection string and an `id`. The templates leave the binding **commented**. `vite build --ssr` warns once if it sees `postgres://` / `mysql://` and no binding.

Create a Hyperdrive (dashboard or CLI), bind it as `HYPERDRIVE`, then `getDb()` (the Worker entry calls `bindWorkerEnv(env)` so Actions and `getDb()` without args see the binding). You can also pass `c.env` explicitly: `getDb(c.env)`.

`env.HYPERDRIVE.connectionString` wins over `DATABASE_URL`. mysql2 on Workers sets `disableEval: true`.
