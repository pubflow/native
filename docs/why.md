# Why Pubflow Native

Native is not a new kind of framework. It is **Hono + TanStack Router + a Vite plugin**, with folders that keep secrets off the page.

Use it when you want one TypeScript app: React in `app/pages`, queries and `DATABASE_URL` in `app/api` / `app/actions`. The server is Hono’s `fetch` — the same export on Node, Bun, and Cloudflare Workers. There is no OpenNext and no Nitro.

Anyone can use it. It is not locked to Pubflow products. Flowless (login) is optional; Native is still React + Hono without it.

| Path | Use it when |
| --- | --- |
| **Pubflow Native** | One TypeScript app. UI in `app/pages`, secrets/DB in `app/api`. |
| **Next.js starter** | The frontend is a separate Next app talking to any Flowfull. |
| **TanStack Start starter** | Same split, React + TanStack Start. |
| **flowfull-node + client** | API in Node/Hono, UI somewhere else. |
| **HonoX** | MPA / islands. Native is a client-navigated app (layouts, prefetch). |
| **flowfull-go / python / rust** | The API is not TypeScript. |

Next and TanStack Start own the server (RSC / Nitro). On **Cloudflare Workers** that usually means an adapter (OpenNext, `@cloudflare/next-on-pages`) that translates those runtimes into workerd and spends CPU-ms per request. Native does not translate: the Worker is `app.fetch`. That is the only technical reason to pick Native over Next **on Workers**. Everywhere else, Next and Remix have more ecosystem. Native does not claim to be better than Next.

The UI talks to this process with same-origin HTTP (`/api`, `POST /api/actions`). One isolate, JSON, no extra proxy. gRPC (or Hono RPC / `hc`) can live behind Native if another service needs it — it is not a faster replacement for the browser.

The failure mode this is for: an AI (or a human) builds a UI, then puts `DATABASE_URL` in the client because there is no same-origin API. Pages are not allowed to import `getDb()` — the **client build fails**. Queries go in `app/api` or `app/actions`. The browser only sees `PUBFLOW_PUBLIC_*` / `VITE_*`.

**Flowless** is the trust layer when you want login — that is Pubflow’s differentiator, not Native. Native sends the session id to Flowless (`POST /auth/bridge/validate`) and then `requireAuth` / `requireRole` limit routes and Actions. See [Auth](./auth.md).

React Native / Expo stays `pubflow create react-native`. Native is web, not mobile.
