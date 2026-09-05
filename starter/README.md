# Pubflow Native starter

This folder **is** the app. Clone it on its own (not the whole `pubflow/native` repo):

```bash
npx degit pubflow/native/starter my-app
cd my-app
bun install
bun run dev
```

Browse the files: [github.com/pubflow/native/tree/master/starter](https://github.com/pubflow/native/tree/master/starter). Same folder as `pubflow create native`.

Pubflow / Flowless auth in this template is **optional**. Delete `app/pages/login`, dashboard guards, and `@pubflow/react` if you just want the framework.

shadcn is already set up (`components.json`, Tailwind v4). Add components with `npx shadcn@latest add dialog`. Do not run `init -t vite`.

`app/actions` is POST JSON to Hono (`/api/actions/...`), not RSC. Hooks like `AuthGuard` do not protect POST — set `export const auth = true` (or `allowedTypes`) and keep `app/actions/_auth.ts`. Server helpers: `requireAuth()` / `requireRole('admin', 'editor')` from `@pubflow/native/auth`.

```bash
bun install
cp .env.example .env   # only if you use Flowless
bun run dev
```

| Script | What it does |
| --- | --- |
| `bun run dev` | Vite + Hono on port 3000 |
| `bun run build` | Client bundle + SSR / Worker bundle |
| `bun run start` | Node production server (`dist/server/node.js`) |
| `bun run start:bun` | Bun production server (`dist/server/bun.js`) |
| `bun run dev:cf` | Wrangler against the built Worker |
| `bun run deploy:cf` | Cloudflare Workers deploy |

Docker: `docker build -t my-app .` (Bun). `Dockerfile.node` if the host is Node-only.

Nixpacks (Coolify / Railway): [`nixpacks.toml`](nixpacks.toml) builds with Bun and starts `dist/server/bun.js`. Commit `bun.lock` so the Bun provider is detected.

Framework package: [`@pubflow/native`](https://www.npmjs.com/package/@pubflow/native). Docs: [github.com/pubflow/native](https://github.com/pubflow/native).
