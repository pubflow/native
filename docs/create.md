# Create

Start from **[starter/](https://github.com/pubflow/native/tree/master/starter)** only — not the whole `pubflow/native` repo.

```bash
npx degit pubflow/native/starter my-app
cd my-app
bun install
bun run dev
```

When the CLI is updated:

```bash
pubflow create native my-app
cd my-app
cp .env.example .env
bun run dev
```

Aliases: `flowloft`, `flowstack`, `pubflow-native` all resolve to `native`.

## Env

Client (browser). `PUBFLOW_PUBLIC_*` and `VITE_*` are equivalent:

```
PUBFLOW_PUBLIC_FLOWLESS_URL=http://localhost:8787
PUBFLOW_PUBLIC_BRIDGE_SECRET=
```

Server only — normal process names, never `VITE_` or `PUBFLOW_PUBLIC_`:

```
FLOWLESS_URL=http://localhost:8787
BRIDGE_VALIDATION_SECRET=
DATABASE_URL=
```

`DATABASE_URL` is not available in `app/pages`. Put queries in `app/api`, `app/actions`, or `app/server.ts`.

## Scripts

- `bun run dev` — Vite + Hono
- `bun run build` — client + SSR
- `bun run start` — Node (`dist/server/node.js`)
- `bun run start:bun` — Bun (`dist/server/bun.js`)
- `bun run dev:cf` / `deploy:cf` — Cloudflare Worker

Nixpacks: `starter/nixpacks.toml` (Coolify / Railway). Docker: `starter/Dockerfile`.
