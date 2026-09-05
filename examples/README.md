# Examples

Cloneable Native apps (CLI extracts these folders from `pubflow/native`):

| Folder | CLI id | What it is |
| --- | --- | --- |
| [`../starter`](../starter) | `native` | Default — auth, Tailwind, Docker, Cloudflare |
| [`minimal`](minimal) | `native-minimal` | No auth. Tailwind. `/items` demo. |
| [`custom-hono-server`](custom-hono-server) | `native-custom-hono` | You own `app/server.ts`. Tailwind. `/items` demo. |

Notes, not templates — do not degit these folders:

| Folder | Use instead |
| --- | --- |
| [`cloudflare-worker`](cloudflare-worker) | Default (`starter/wrangler.jsonc` + `bun run deploy:cf`) |
| [`with-auth`](with-auth) | Default (`starter/` login + dashboard) |
| [`shadcn`](shadcn) | Default (`npx shadcn@latest add dialog`) |
