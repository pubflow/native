# Changelog

All notable changes to `@pubflow/native` are documented here. Breaking changes bump the major version.

## Unreleased

- Client build fails if a page imports `getDb()` or `app/api` (guided `[pubflow-native]` error).
- GitHub CI: unit tests, typecheck, `wrangler deploy --dry-run` size budget.
- Docs: Native is Hono + TanStack Router + Vite, not a new framework category. Hyperdrive stays opt-in.

## 1.0.0

- First stable: Hono `fetch` + TanStack Router + Vite plugin. Pages in `app/pages`, queries in `app/api` / `app/actions`.
- Cloudflare Worker entry without OpenNext. Optional Flowless auth (`requireAuth` / `requireRole`).
