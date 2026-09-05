# shadcn/ui

Default Native (`starter/`) is already a shadcn project: [`components.json`](../starter/components.json), Tailwind v4, `cn()`, and `@/` → `app/`. Pubflow does **not** install components. Use the official shadcn CLI — same as Vite / TanStack Start **after** `init`.

There is no `with-shadcn` starter. Same idea as Cloudflare and with-auth: it lives on Default.

## Add components

```bash
npx shadcn@latest add dialog
npx shadcn@latest add sonner dropdown-menu
npx shadcn@latest add --all
```

Files land in `app/components/ui`. Import `@/components/ui/...`. Extra deps (radix, etc.) come from that CLI.

The starter ships a few hand-written UI files (button, card, input, label, badge). `npx shadcn add button --overwrite` replaces them with the registry version. That is expected.

## Registries and presets

Edit `registries` in `components.json`, then:

```bash
npx shadcn@latest add @v0/dashboard
npx shadcn@latest add https://example.com/r/item.json
```

New theme from [ui.shadcn.com/create](https://ui.shadcn.com/create):

```bash
npx shadcn@latest apply <code>
npx shadcn@latest apply <code> --only theme
```

`search`, `view`, `docs`, and `migrate` also work against this `components.json`.

## Do not run create-project init

These **break** Native (`app/` + `native()`, not `src/` + `@vitejs/plugin-react`):

```bash
npx shadcn@latest init -t vite
npx shadcn@latest init -t start
npx shadcn@latest init --name my-app
```

Default is an **existing** project. Skip Vite-from-scratch docs. Only `add` / `apply`.

`init` without `-t` on Default can overwrite `components.json` (`--force`). Do not use it unless you know you want that.

## Minimal / Custom Hono

Those apps already include Tailwind v4 (`@tailwindcss/vite`). They do **not** include shadcn. Scaffold shadcn once, then use the official CLI:

```bash
pubflow add shadcn
bun install
npx shadcn@latest add button
```

`pubflow add shadcn` does not wrap `shadcn add`. If `components.json` already exists (Default), it tells you to run `npx shadcn@latest add <name>`. If Tailwind is already in `vite.config.ts`, the command does not add it twice.
