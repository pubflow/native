# Hyperdrive (Workers + Postgres / MySQL)

You do **not** need this for Turso (`libsql://`), an empty `DATABASE_URL`, or Node / Bun / Docker. Clone, `bun run deploy:cf`, and the Deploy to Cloudflare button work without it.

A Worker isolate is short-lived. A direct `pg` / `mysql2` pool opens TCP from that isolate: extra connections to your database, and extra CPU in the isolate (free tier is **10 ms CPU per request**). Waiting on the network is not CPU; opening the pool and speaking the protocol is. Hyperdrive keeps a pool at the edge and gives the Worker a local-looking connection. Native `getDb()` reads `env.HYPERDRIVE` when the binding exists (pool size 1).

Hyperdrive wraps **your** Postgres or MySQL. Wrangler will not create it for you (unlike KV / R2 / D1). You need an `id` and a connection string. It is a Workers Paid feature.

## Dashboard (easiest)

1. Open [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Storage & databases** → **Hyperdrive** (or Workers & Pages → Hyperdrive)
3. **Create**
4. Name it (for example `native-db`)
5. Paste your `postgres://` or `mysql://` connection string
6. Create, then copy the **id**

## CLI

```bash
npx wrangler hyperdrive create native-db --connection-string="postgres://user:pass@host:5432/db"
```

Copy the `id` from the output.

## Bind it

In `wrangler.jsonc` uncomment the block and paste the id. The binding name must be `HYPERDRIVE`:

```jsonc
"hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<id>" }]
```

`getDb()` already looks for that binding (the Worker entry calls `bindWorkerEnv(env)`). Then `bun run deploy:cf`.

On Node / Bun, keep using `DATABASE_URL` — no Hyperdrive.
