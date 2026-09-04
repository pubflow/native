# Pubflow Native starter

This folder **is** the app. Clone it on its own (not the whole `pubflow/native` repo):

```bash
npx degit pubflow/native/starter my-app
cd my-app
bun install
bun run dev
```

Browse the files: [github.com/pubflow/native/tree/master/starter](https://github.com/pubflow/native/tree/master/starter).

Pubflow / Flowless auth in this template is **optional**. Delete `app/pages/login`, dashboard guards, and `@pubflow/react` if you just want the framework.

```bash
bun install
cp .env.example .env   # only if you use Flowless
bun run dev
```

| Script | What it does |
| --- | --- |
| `bun run dev` | Vite + Hono on port 3000 |
| `bun run build` | Client bundle + SSR / Worker bundle |
| `bun run start` | Node production server |
| `bun run dev:cf` | Wrangler against the built Worker |
| `bun run deploy:cf` | Cloudflare Workers deploy |

Framework package: [`@pubflow/native`](https://www.npmjs.com/package/@pubflow/native). Docs: [github.com/pubflow/native](https://github.com/pubflow/native).
