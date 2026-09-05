# Custom Hono server

When `app/server.ts` exists, it **replaces** the generated handler. You mount Hono yourself and call `pages()` / `apiFromDir()` / `actionsFromDir()` from `@pubflow/native`. Clone this folder on its own — it does not need `starter/` or the rest of the repo.

```bash
npx degit pubflow/native/examples/custom-hono-server my-app
cd my-app
bun install
bun run dev
```

Or `pubflow create native-custom-hono my-app`.

```bash
bun run build
bun run start          # Node: dist/server/node.js
bun run start:bun      # Bun: dist/server/bun.js
bun run deploy:cf      # Cloudflare Worker (wrangler.jsonc in this folder)
```

Docker: `docker build -t my-app .` (Bun). `Dockerfile.node` if the host is Node-only. Nixpacks: `nixpacks.toml`.
