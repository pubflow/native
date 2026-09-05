# Upgrade

`@pubflow/native` is an npm package. Cloning a starter copies its `package.json`. Publishing a new library version does **not** change apps you already created.

Templates depend on `"@pubflow/native": "^0.1.5"`: patch releases on `0.1.x` install on `bun update` / a fresh `bun install`. `0.2.0` will not until you bump the range.

In an existing app:

```bash
bun add @pubflow/native@latest
```

Do not put `"latest"` in `package.json`. Routing, Vite, and scan live in `node_modules/@pubflow/native` — you get them by updating that dependency.
