# CLI

Package [`pubflow`](https://www.npmjs.com/package/pubflow) — bins `pubflow` and `pbfl`.

```bash
npm install -g pubflow
pnpm add -g pubflow
yarn global add pubflow
bun add -g pubflow
```

Or `npx pubflow` / `pnpm dlx pubflow` / `yarn dlx pubflow` / `bunx pubflow`.

```bash
pubflow create native my-app
pubflow start native my-app
pubflow create native-minimal my-app
pubflow create native-custom-hono my-app
pubflow init                 # Full-stack app → Choose a Native starter
pubflow start                # alias of create (guided if no template)
pubflow add pages            # adopt flowfull-node / Hono + Vite pages
pubflow add native           # only if Vite already exists
pubflow add shadcn           # Tailwind + components.json if missing; then npx shadcn add
pubflow doctor               # Node, bun, git, plus Vite / React / Hono from package.json
```

`pubflow create fullstack` (two folders `apps/web` + `apps/api`) is a different product. Native is one process.

All three Native ids download GitHub `pubflow/native` and extract a folder:

| id | extract |
| --- | --- |
| `native` | `starter/` |
| `native-minimal` | `examples/minimal` |
| `native-custom-hono` | `examples/custom-hono-server` |
