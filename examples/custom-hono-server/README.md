# Custom Hono server

When `app/server.ts` exists, it **replaces** the generated handler. You mount Hono yourself and call `pages()` / `apiFromDir()` / `actionsFromDir()` from `@pubflow/native`.

```bash
bun install
bun run dev
```
