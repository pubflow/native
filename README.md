# Pubflow Native

**Full-stack TypeScript framework** — React pages and a Hono API in one process. One repo, one `dev`, one deploy.

Anyone can use it. It is **not** locked to Pubflow products, accounts, or auth. A blog, a SaaS, an internal tool, or a Pubflow app all look the same: `app/pages` for UI, `app/api` for server code.

Hono owns `fetch`. TanStack Router is a library for file routes and SSR — not TanStack Start, not Next.js, not HonoX. The browser talks HTTP JSON to that same process. gRPC (or Hono RPC / `hc`) can sit behind Native if another service needs it; it is not a faster path for the UI.

Package: [`@pubflow/native`](https://www.npmjs.com/package/@pubflow/native)

```
app/pages/     UI (layout.tsx, index.tsx, [id].tsx)
app/api/       Hono apps → /api/...
app/actions/   functions → POST /api/actions/<id>
app/server.ts  optional — you own fetch
index.html
vite.config.ts plugins: [native()]
```

Pages cannot read `DATABASE_URL`. Put queries and secrets in `app/api` or `app/actions`. The browser only sees `PUBFLOW_PUBLIC_*` / `VITE_*`.

## New app: clone [starter/](https://github.com/pubflow/native/tree/master/starter)

That folder **is** the app. `git clone` on the repo URL would pull library, docs, and examples too. Clone **only** `starter/`:

```bash
npx degit pubflow/native/starter my-app
cd my-app
bun install
bun run dev
```

[`npx degit`](https://github.com/unjs/degit) copies [`starter/`](https://github.com/pubflow/native/tree/master/starter) onto `my-app/` — same files you see in that GitHub tree, nothing else.

```bash
bun run dev          # Vite + Hono (port 3000)
bun run build        # client + SSR
bun run start        # node dist/server/node.js
bun run deploy:cf    # Cloudflare Worker
```

The starter ships login/dashboard/Tailwind as a complete example. **Delete or ignore auth** if you do not use Flowless — Native does not require it. `GET /` and your own `/api/*` routes work with no Pubflow services running.

When `pubflow create native` is on npm it will copy this same `starter/` folder.

## Existing project

`bun add` the library. You do not need the rest of Pubflow.

```bash
bun add @pubflow/native@0.1.4 @tanstack/react-router hono react react-dom
bun add -d vite
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import native from '@pubflow/native/vite'

export default defineConfig({
  plugins: [native()],
})
```

```html
<!-- index.html -->
<div id="root"><!--ssr-outlet--></div>
```

The plugin injects the client bundle. No `main.tsx`.

```tsx
// app/pages/layout.tsx
import type { ReactNode } from 'react'
export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

// app/pages/index.tsx
export default function HomePage() {
  return <h1>Hello</h1>
}
```

```ts
// app/api/hello.ts → GET /api/hello
import { Hono } from 'hono'
const hello = new Hono()
hello.get('/', (c) => c.json({ hello: true }))
export default hello
```

```ts
// app/actions/ping.ts → POST /api/actions/ping
export async function ping() {
  return { ok: true }
}
```

`GET /health` is registered for you. `bunx vite`, then hit `/` and `/api/hello`.

Already on Hono? Keep your routes and mount pages for the rest:

```ts
import { pages } from '@pubflow/native/pages'
import { apiFromDir } from '@pubflow/native/api'

const app = new Hono()
app.route('/api', apiFromDir(import.meta.glob('./api/**/*.{ts,js}', { eager: true })))
app.all('*', pages())
export default app
```

See [`examples/custom-hono-server`](examples/custom-hono-server) and [`examples/minimal`](examples/minimal).

## What it is for

- One TypeScript codebase instead of a separate frontend repo and API repo
- Same-origin `/api` and `POST /api/actions` so secrets stay on the server
- Hono `fetch` on Bun, Node, and Cloudflare Workers — no RSC, no Nitro, no gRPC for the UI
- File routes you already know: `layout.tsx`, `index.tsx`, `[id].tsx`

Use something else for mobile (`pubflow create react-native` / Expo), a non-TS API (Go, Python, …), or an MPA/islands setup (HonoX).

## Pages and API

| File | Route |
| --- | --- |
| `app/pages/layout.tsx` | Nested layout (`children`) |
| `app/pages/index.tsx` | `/` |
| `app/pages/dashboard/index.tsx` | `/dashboard` |
| `app/pages/[id].tsx` | `/$id` |
| `app/api/users.ts` | `/api/users` |
| `app/api/_middleware.ts` | Middleware for `/api/*` |
| `app/actions/posts/createPost.ts` | `POST /api/actions/posts.createPost` |

Default export is the page, layout, or Hono app. You do not write `createFileRoute`. Generated files live in `.pubflow/generated/` (gitignored).

Optional env: browser `PUBFLOW_PUBLIC_*` or `VITE_*` (`publicEnv()`). Server uses normal names (`DATABASE_URL`, …). `pubflow.config.ts` is metadata only in v0.1.

## Optional Pubflow extras

The starter can talk to [Flowless](https://github.com/pubflow) for login (`@pubflow/react`). That is an add-on, same as plugging any other auth. Skip it and Native is still a full-stack React + Hono app.

## This repository

| Path | What it is |
| --- | --- |
| [`library/`](library/) | npm `@pubflow/native` |
| [`starter/`](https://github.com/pubflow/native/tree/master/starter) | the app — `npx degit pubflow/native/starter` |
| `examples/`, `docs/` | extra samples — not required |

Root `package.json` is private. After a library fix: publish npm, **then** bump the pin in `starter/package.json`.

More: [docs/](docs/)
