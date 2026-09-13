# Changelog

All notable changes to `@pubflow/native` are documented here. Breaking changes bump the major version.

## Unreleased

- Client build fails if a page imports `getDb()` or `app/api` (guided `[pubflow-native]` error).
- GitHub CI: unit tests, typecheck, `wrangler deploy --dry-run` size budget.
- Docs: minutes from idea to a live URL (Hono + TanStack Router + Vite). Cloudflare Workers is one host, not the only one. Hyperdrive stays opt-in.

## 1.0.5

- HTML boot script: Worker `PUBFLOW_PUBLIC_FLOWLESS_URL` (same origin as `API_BASE_URL`) reaches the client. Unprefixed `FLOWLESS_URL` is optional.

## 1.0.0

- First stable: Hono `fetch` + TanStack Router + Vite plugin. Pages in `app/pages`, queries in `app/api` / `app/actions`.
- Cloudflare Worker entry without OpenNext. Optional Flowless auth (`requireAuth` / `requireRole`).
