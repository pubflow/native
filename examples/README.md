# Examples

Cloneable Native apps (CLI extracts these folders from `pubflow/native`):

| Folder | CLI id | What it is | Deploy |
| --- | --- | --- | --- |
| [`../starter`](../starter) | `native` | Default — auth, Tailwind, Docker, Cloudflare | <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/pubflow/native/tree/master/starter"><img src="https://cloud.notside.com/deploy-to-cloudflare.svg" alt="Deploy to Cloudflare" height="32" /></a> |
| [`minimal`](minimal) | `native-minimal` | No auth. Tailwind. `/items` demo. | <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/pubflow/native/tree/master/examples/minimal"><img src="https://cloud.notside.com/deploy-to-cloudflare.svg" alt="Deploy to Cloudflare" height="32" /></a> |
| [`custom-hono-server`](custom-hono-server) | `native-custom-hono` | You own `app/server.ts`. Tailwind. `/items` demo. | <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/pubflow/native/tree/master/examples/custom-hono-server"><img src="https://cloud.notside.com/deploy-to-cloudflare.svg" alt="Deploy to Cloudflare" height="32" /></a> |

Notes, not templates — do not degit these folders:

| Folder | Use instead |
| --- | --- |
| [`cloudflare-worker`](cloudflare-worker) | Default (`starter/wrangler.jsonc` + `bun run deploy:cf`) |
| [`with-auth`](with-auth) | Default (`starter/` login + dashboard) |
| [`shadcn`](shadcn) | Default (`npx shadcn@latest add dialog`) |
