# Pubflow Native

Pubflow Native is an intermediate stack on **Hono, TanStack Router, and Vite**: minutes from idea to a page + `/api`, then the same `fetch` on Node, Bun, Docker, or Cloudflare Workers. Workers is one host, not the only one. Drop files in `app/pages` and `app/api`; the client build fails if a page imports `getDb()`. Anyone can use it — `npx degit pubflow/native/starter my-app`, or `bun add @pubflow/native`. Pubflow auth is optional.

- [Why Native](./why.md)
- [Create](./create.md)
- [Pages](./pages.md)
- [API](./api.md)
- [Backend](./backend.md)
- [Actions](./actions.md)
- [Auth](./auth.md)
- [Data and env](./data-env.md)
- [Env](./env.md)
- [Database](./db.md)
- [Hyperdrive](./hyperdrive.md)
- [Cache](./cache.md)
- [Mail](./mail.md)
- [Security](./security.md)
- [Config](./config.md)
- [CLI](./cli.md)
- [shadcn/ui](./shadcn.md)
- [Deploy](./deploy.md)
- [Changelog](../CHANGELOG.md)
- [Upgrade](./upgrade.md)
- [Adoption](./adoption.md)
- [Migrate from Next / TanStack Start](./migrate.md)

Package: `@pubflow/native`. CLI: `pubflow create native` or `pubflow start native` (also `native-minimal`, `native-custom-hono`).
