# Pubflow Native — Full Stack App Framework

**React pages and a Hono API in one process.** One repo, one `dev`, one deploy. An **app** here is one instance, not a repo generator and not React Native.

UI (`app/pages`) and the server (`app/api`, `app/actions`) live together. A blog, a SaaS, an internal tool, or a new app — yours or built with an AI — without a frontend repo and a backend repo. Starters get you running; [Backend](docs/backend.md) is how the API grows (`app/lib`, `v1`/`v2`, `app/server.ts`).

Secrets stay on the server. Pages cannot read `DATABASE_URL`. Queries and keys go in `app/api` or `app/actions`. The browser only sees `PUBFLOW_PUBLIC_*` / `VITE_*`.

Login is optional. [Flowless](https://www.pubflow.com/products/flowless) is a trust layer: it knows **who** the user is and their **role** (admin, editor, …). The browser keeps a session id. Native asks Flowless if that session is valid, then you gate routes and Actions with `requireAuth` / `requireRole` — no extra auth stack, no secrets in the page. Skip Flowless and Native is still React + API.

Anyone can use it. It is **not** locked to Pubflow products. Want the stack comparison (Next, TanStack Start, HonoX)? See [Why Native](docs/why.md).

Package: [`@pubflow/native`](https://www.npmjs.com/package/@pubflow/native)

```
app/pages/     UI (layout.tsx, index.tsx, [id].tsx → { id } props)
app/api/       Hono apps → /api/...  (.get / .post; c.req.param('id'))
app/lib/       domain code (not mounted)
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

The starter (Default) is a complete example: login/dashboard, Tailwind v4, and **shadcn already wired** (`components.json`, `cn()`, `@/` → `app/`, a few UI files). Add more with the official CLI — `npx shadcn@latest add dialog` — not `init -t vite`. **Delete or ignore auth** if you do not use Flowless — Native does not require it. `GET /` and your own `/api/*` routes work with no Pubflow services running.

`pubflow create native` / `pubflow start native` copies `starter/`. `native-minimal` and `native-custom-hono` copy those example apps (also cloneable with degit). Cloudflare, auth, and shadcn are on Default — `examples/cloudflare-worker`, `examples/with-auth`, and `examples/shadcn` are notes, not templates. Minimal and Custom Hono ship Tailwind v4 (no shadcn); add components with `pubflow add shadcn` then `npx shadcn add`. Open `/items` there for list → `[id]` → `/api/items`.

Install the CLI ([`pubflow`](https://www.npmjs.com/package/pubflow) on npm — bins `pubflow` and `pbfl`). Pick the manager you already use:

```bash
npm install -g pubflow
pnpm add -g pubflow
yarn global add pubflow
bun add -g pubflow
```

Without a global install:

```bash
npx pubflow start native my-app
npx pubflow create native my-app
pnpm dlx pubflow start native my-app
yarn dlx pubflow create native my-app
bunx pubflow start native my-app
```

## Existing project

`bun add` the library. You do not need the rest of Pubflow.

```bash
bun add @pubflow/native@^0.1.5 @tanstack/react-router hono react react-dom
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

// app/pages/items/[id].tsx — id is a prop
export default function ItemPage({ id }: { id: string }) {
  return <p>{id}</p>
}
```

```ts
// app/api/hello.ts → GET /api/hello
import { Hono } from 'hono'
const hello = new Hono()
hello.get('/', (c) => c.json({ hello: true }))
hello.get('/:id', (c) => c.json({ id: c.req.param('id') }))
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

See [`examples/`](examples/) — Minimal and Custom Hono are cloneable apps; Cloudflare, with-auth, and shadcn point at Default.

## What it is for

- UI and API in one TypeScript app — not two repos
- Secrets and database access on the server (`/api`, Actions); pages cannot read `DATABASE_URL`
- Flowless as a trust layer when you want login: session id in, who + role out; `requireAuth` / `requireRole` to limit what they can do
- File routes you already know: `layout.tsx`, `index.tsx`, `[id].tsx`

Native is web. For mobile use `pubflow create react-native` / Expo. For a non-TypeScript API use Go, Python, or Rust. For an MPA / islands app, HonoX. Details: [Why Native](docs/why.md).

## Pages and API

| File | Route |
| --- | --- |
| `app/pages/layout.tsx` | Nested layout (`children`; path params as extra props) |
| `app/pages/index.tsx` | `/` |
| `app/pages/about.tsx` | `/about` |
| `app/pages/products/index.tsx` | `/products` (same as `products.tsx` — folder wins if both exist) |
| `app/pages/items/[id].tsx` | `/items/$id` — page receives `{ id }` |
| `app/api/users.ts` | `/api/users` (write `.get` / `.post`) |
| `app/api/products/index.ts` | `/api/products` |
| `app/api/v1/products.ts` | `/api/v1/products` |
| `app/api/_middleware.ts` | Middleware for `/api/*` |
| `app/actions/posts/createPost.ts` | `POST /api/actions/posts.createPost` |

Default export is the page, layout, or Hono app. You do not write `createFileRoute`. Optional: `usePathParams()` from `@pubflow/native` or `useParams` from TanStack. Generated files live in `.pubflow/generated/` (gitignored).

More: [Pages](docs/pages.md), [API](docs/api.md), [Backend](docs/backend.md), [Upgrade](docs/upgrade.md).

Optional env: browser `PUBFLOW_PUBLIC_*` or `VITE_*` (`publicEnv()`). Server uses normal names (`DATABASE_URL`, …). `pubflow.config.ts` is metadata only in v0.1.

## Optional Pubflow extras

[Flowless](https://github.com/pubflow) is the trust layer: who the user is, their role, and a session id Native can check. Gate `/api` and Actions with `requireAuth` / `requireRole`. Skip it if you do not need login — Native is still React + Hono. See [Auth](docs/auth.md) and [Why Native](docs/why.md).

## This repository

| Path | What it is |
| --- | --- |
| [`library/`](library/) | npm `@pubflow/native` |
| [`starter/`](https://github.com/pubflow/native/tree/master/starter) | Default app — auth, Tailwind, shadcn, Cloudflare. `npx degit pubflow/native/starter` / `pubflow create native` |
| [`examples/minimal`](examples/minimal), [`examples/custom-hono-server`](examples/custom-hono-server) | other cloneable Native apps |
| `examples/cloudflare-worker`, `examples/with-auth`, `examples/shadcn`, `docs/` | notes / docs — not templates |

Root `package.json` is private. After a library publish: bump `"@pubflow/native"` in the three templates (see [Upgrade](docs/upgrade.md)).

More: [docs/](docs/)
