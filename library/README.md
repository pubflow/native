# @pubflow/native

**Full-stack TypeScript framework:** React pages + Hono API in one process. Universal — any TypeScript app can use it; Pubflow auth is optional.

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
