# Config

`pubflow.config.ts` is the Pubflow dial. `vite.config.ts` stays visible (Tailwind, Cloudflare, extra Vite plugins).

```ts
import { defineConfig, type NativeConfig } from '@pubflow/native/config'

export default defineConfig({
  auth: { provider: 'flowless' },
  runtime: 'bun', // 'node' | 'cloudflare'
} satisfies NativeConfig)
```

```ts
import { defineConfig } from 'vite'
import native from '@pubflow/native/vite'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [native(), tailwind()],
})
```

CLI metadata may also live in `.pubflow/pubflow.json`. Generated router types go to `.pubflow/generated/`.

`runtime` in this file is **intent**, not a bundler switch. `native()` always emits `dist/server/node.js`, `dist/server/bun.js`, and `dist/server/worker.js`. Pick the one your host uses.
