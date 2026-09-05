# Minimal Pubflow Native

One app: pages, Tailwind v4, and `/api`. No auth, no shadcn. Clone this folder on its own — it does not need `starter/` or the rest of the repo.

```bash
npx degit pubflow/native/examples/minimal my-app
cd my-app
bun install
bun run dev
```

Or `pubflow create native-minimal my-app`.

Open `/items` for a list, `/items/1` for a dynamic page (`{ id }` props + `fetch('/api/items/1')`), and `/about`.

```bash
bun run build
bun run start          # Node: dist/server/node.js
bun run start:bun      # Bun: dist/server/bun.js
bun run deploy:cf      # Cloudflare Worker (wrangler.jsonc in this folder)
```

Docker: `docker build -t my-app .` (Bun). `Dockerfile.node` if the host is Node-only. Nixpacks: `nixpacks.toml`.

Want shadcn components later: `pubflow add shadcn` then `npx shadcn@latest add button`. Growing the API: [Backend](../../docs/backend.md).
