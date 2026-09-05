# shadcn/ui

This folder is **not** a Native starter. Do not clone it.

shadcn lives on **Default** (`starter/`): `components.json`, Tailwind v4, `app/components/ui`. Add more with the official CLI:

```bash
npx degit pubflow/native/starter my-app
cd my-app
bun install
npx shadcn@latest add dialog
```

Or `pubflow create native my-app`.

Do not run `npx shadcn@latest init -t vite` or `-t start` on a Native app. See [docs/shadcn.md](../../docs/shadcn.md).

Minimal / Custom Hono already include Tailwind. Add shadcn with `pubflow add shadcn`, then `npx shadcn@latest add …`.
