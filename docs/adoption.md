# Adoption

Until `pubflow add pages` / `pubflow add native` ship on npm, follow the recipes on the [root README](../README.md).

## Existing flowfull-node (Hono)

```bash
pubflow add pages
```

This does **not** move `src/routes`. It adds `app/pages`, a Vite config with `@pubflow/native/vite`, dependencies, and mounts `pages()` for non-API requests when `src/app.ts` is detected.

Keep serving `/api` from your current Hono routes. New UI lives in `app/pages`.

## Existing Vite app

```bash
pubflow add native
```

Requires Vite in `package.json`. If Vite is missing, the command fails and `pubflow doctor` tells you to add Vite first (this is not CRA/Express/webpack).
