# Why Pubflow Native

Native is for the gap from **idea to a live URL** — minutes, not an afternoon of config. You (or an AI) drop a React page in `app/pages` and a Hono app in `app/api`. Secrets stay off the client by default.

It is not a new runtime. It is **Hono + TanStack Router + a Vite plugin** — production pieces, one convention. Plenty of frameworks put UI and API in one repo. Native is optimized for how fast that first page and `/api` route exist, then the same `fetch` on whatever host you pick.

Use it when you want one TypeScript app: React in `app/pages`, queries and `DATABASE_URL` in `app/api` / `app/actions`. Hono’s `fetch` is the server on **Node, Bun, Docker, Nixpacks, a VPS, or Cloudflare Workers**. Workers is optional (`bun run deploy:cf`), not the product. See [Deploy](./deploy.md).

Anyone can use it. It is not locked to Pubflow products. Flowless (login) is optional; Native is still React + Hono without it.

This is the “many app ideas, little time” path. It is not a replacement for Next on a large product team.

| Path | Use it when |
| --- | --- |
| **Pubflow Native** | One TypeScript app. UI in `app/pages`, secrets/DB in `app/api`. |
| **Next.js starter** | The frontend is a separate Next app talking to any Flowfull. |
| **TanStack Start starter** | Same split, React + TanStack Start. |
| **flowfull-node + client** | API in Node/Hono, UI somewhere else. |
| **HonoX** | MPA / islands. Native is a client-navigated app (layouts, prefetch). |
| **flowfull-go / python / rust** | The API is not TypeScript. |

On **Cloudflare Workers**, Next usually goes through OpenNext (or similar). Native’s Worker is `app.fetch` — a deploy shape, not a claim that Native is faster. **TanStack Start** on Workers is a peer: same Router family, Cloudflare’s Vite plugin. Pick Native if you want `app/pages` + Hono `app/api` and a client that cannot import `getDb()`. Pick Start if you want Start’s server functions and a single route tree. Everywhere else, Next and Remix have more ecosystem.

The UI talks to this process with same-origin HTTP (`/api`, `POST /api/actions`). One isolate, JSON, no extra proxy. gRPC (or Hono RPC / `hc`) can live behind Native if another service needs it — it is not a faster replacement for the browser.

The folders are a mold for humans and agents. The failure they prevent: an AI (or a beginner) builds a UI and puts `DATABASE_URL` in the client because there is no same-origin API. Pages are not allowed to import `getDb()` — the **client build fails**. Queries go in `app/api` or `app/actions`. The browser only sees `PUBFLOW_PUBLIC_*` / `VITE_*`.

**Flowless** is the trust layer when you want login — that is Pubflow’s differentiator, not Native. Native sends the session id to Flowless (`POST /auth/bridge/validate`) and then `requireAuth` / `requireRole` limit routes and Actions. See [Auth](./auth.md).

React Native / Expo stays `pubflow create react-native`. Native is web, not mobile.
