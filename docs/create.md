# Create

Default app: **[starter/](https://github.com/pubflow/native/tree/master/starter)** — not the whole `pubflow/native` repo.

```bash
npx degit pubflow/native/starter my-app
cd my-app
bun install
bun run dev
```

CLI (`pubflow init` → Full-stack → Choose a Native starter). Install [`pubflow`](https://www.npmjs.com/package/pubflow) with your manager (`npm install -g pubflow`, `pnpm add -g pubflow`, `yarn global add pubflow`, `bun add -g pubflow`) or run `npx pubflow` / `pnpm dlx pubflow` / `bunx pubflow`.

```bash
pubflow create native my-app
pubflow start native my-app
pubflow create native-minimal my-app
pubflow create native-custom-hono my-app
```

`pubflow start` is a full alias of `pubflow create` (same templates and flags).

| CLI id | Folder | What you get |
| --- | --- | --- |
| `native` | `starter/` | Auth, Tailwind, Docker, Cloudflare |
| `native-minimal` | `examples/minimal` | No auth, no Tailwind |
| `native-custom-hono` | `examples/custom-hono-server` | You own `app/server.ts` |

`cloudflare-worker`, `with-auth`, and `shadcn` under `examples/` are notes, not templates. Cloudflare, auth, and shadcn are on Default.

Aliases for Default: `flowloft`, `flowstack`, `pubflow-native`. Custom Hono: `custom-hono`, `native-custom-hono-server`.

```bash
cd my-app
cp .env.example .env
bun run dev
```

## Env

Client (browser) — same as create-flowfull-client (`VITE_API_BASE_URL` / `VITE_BRIDGE_SECRET`). `PUBFLOW_PUBLIC_*` and `VITE_*` are equivalent; Vite inlines both. Flowless is the source of truth.

```
PUBFLOW_PUBLIC_FLOWLESS_URL=http://localhost:8787
PUBFLOW_PUBLIC_BRIDGE_SECRET=
```

Server uses the **same** Flowless URL and Bridge string, unprefixed so Vite never mixes them with `DATABASE_URL`:

```
FLOWLESS_URL=http://localhost:8787
BRIDGE_SECRET=
DATABASE_URL=
```

`BRIDGE_VALIDATION_SECRET` is an alias of `BRIDGE_SECRET`. `DATABASE_URL` is the only secret and is not available in `app/pages`. Put queries in `app/api`, `app/actions`, or `app/server.ts`.

Minimal and Custom Hono only need `PORT` unless you add auth yourself.

## Scripts

- `bun run dev` — Vite + Hono
- `bun run build` — client + SSR
- `bun run start` — Node (`dist/server/node.js`)
- `bun run start:bun` — Bun (`dist/server/bun.js`)
- `bun run dev:cf` / `deploy:cf` — Cloudflare Worker (`wrangler.jsonc` in that app)

Nixpacks: `nixpacks.toml` in the app folder (Coolify / Railway). Docker: `Dockerfile` in the app folder.
