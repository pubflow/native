# Pubflow Native

Fullstack TypeScript for Pubflow: React pages and Hono APIs in one process.

```
4/native/
├── library/     # npm @pubflow/native
├── starter/     # pubflow create native
├── examples/
└── docs/
```

```bash
cd 4/native
bun install
bun test
cd starter
bun run dev
```

One GitHub repo (`pubflow/native`): library + starter + examples + docs. Publish **only** `library/` to npm as `@pubflow/native`. `pubflow create native` copies `starter/` from the GitHub tarball. Do not put nested git remotes in `library/` or `starter/`.

