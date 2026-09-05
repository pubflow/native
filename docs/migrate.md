# Migrate from Next.js or TanStack Start

Native is not a drop-in compiler for RSC or TanStack Start server functions.

## From Next (`next-flowfull-client`)

1. Move `src/app/**/page.tsx` to `app/pages/**/index.tsx` (and `layout.tsx`).
2. Replace `next/navigation` with `@tanstack/react-router` (`Link`, `useNavigate`).
3. Keep `@pubflow/react` providers; rename `NEXT_PUBLIC_*` to `PUBFLOW_PUBLIC_*` (or `VITE_*`).
4. Move Route Handlers / server-only DB code into `app/api` Hono apps or `app/actions`.
5. Delete OpenNext / `next.config`. Use `wrangler.jsonc` from this starter.

## From TanStack Start (`react-flowfull-client`)

1. Keep TanStack Router components; drop `@tanstack/react-start` and Nitro.
2. Replace `createFileRoute` file routes with default-export pages under `app/pages` (Native generates the route tree).
3. Move server functions to `app/actions` (POST JSON) or Hono `app/api`.
4. Point Vite at `native()` instead of `tanstackStart()` + `nitro()`.

Auth stays `@pubflow/react`. Do not invent SSR cookie sessions to “replace” Next cookies.
