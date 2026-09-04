# @pubflow/native

Pubflow Native runs React pages and Hono APIs in one process. Hono owns `fetch`. TanStack Router is used as a library for file-based pages and SSR — not TanStack Start.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import native from '@pubflow/native/vite'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [native(), tailwind()],
})
```

Client env: `PUBFLOW_PUBLIC_*` or `VITE_*` (`import { publicEnv } from '@pubflow/native/env'`). Server env stays unprefixed (`FLOWLESS_URL`, `DATABASE_URL`).

`pubflow.config.ts` (`defineConfig` from `@pubflow/native/config`) is project metadata — auth provider and intended runtime. v0.1 does not switch the Vite/SSR bundle from `runtime: 'bun'`. Cloudflare uses the starter `wrangler.jsonc` + `bun run deploy:cf`. Deno is typed but not a first-class entry yet.

This package ships TypeScript source. Vite compiles it (`ssr.noExternal: ['@pubflow/native']`). Publish from this `library/` folder (`npm publish --access public`). The GitHub repo `pubflow/native` also contains `starter/` (CLI tarball) and examples; do not nest extra git repos inside `library/` or `starter/`.
