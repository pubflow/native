# @pubflow/native

**Pubflow Native — Full Stack App Framework.** React pages + Hono API in one process. Universal — any TypeScript app can use it; Pubflow auth is optional.

```bash
bun add @pubflow/native @tanstack/react-router hono react react-dom
bun add -d vite
```

```ts
import { defineConfig } from 'vite'
import native from '@pubflow/native/vite'

export default defineConfig({
  plugins: [native()],
})
```

New app — clone only [`starter/`](https://github.com/pubflow/native/tree/master/starter):

```bash
npx degit pubflow/native/starter my-app
cd my-app && bun install && bun run dev
```

## Layout

```
app/pages/      React routes — [id].tsx receives { id }
app/api/        Hono → /api/...  (.get / .post)
app/lib/        domain code (not mounted)
app/actions/    functions → POST /api/actions/<id>
```

Pages cannot read `DATABASE_URL`. Put secrets in `app/api` or `app/actions`. Optional: `usePathParams()` from this package.

Pubflow Actions are same-origin POST JSON, not RSC and not gRPC. The UI path is HTTP on this process; gRPC can live behind Native later if another service talks to it.

Optional server auth: `import { requireAuth, requireRole } from '@pubflow/native/auth'` (Flowless). Not pulled into the client. Login UI stays `@pubflow/react`.

Docs: [github.com/pubflow/native](https://github.com/pubflow/native) — [pages](https://github.com/pubflow/native/blob/master/docs/pages.md), [backend](https://github.com/pubflow/native/blob/master/docs/backend.md), [upgrade](https://github.com/pubflow/native/blob/master/docs/upgrade.md).
