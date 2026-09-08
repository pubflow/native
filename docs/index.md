# Pubflow Native

Pubflow Native is for shipping a secure full-stack TypeScript app faster — by you or with an AI. React pages and a Hono API in **one process**: drop files in `app/pages` and `app/api`; the client build fails if a page imports `getDb()`. Hono’s `fetch` is the server (Node, Bun, Workers). Anyone can use it — `npx degit pubflow/native/starter my-app`, or `bun add @pubflow/native`. Pubflow auth is optional.

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
