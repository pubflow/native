# Why Pubflow Native

Native is for TypeScript apps that should not split into a Flowfull backend plus a separate Flowfull client. UI and API share one process. Secrets stay on the server.

| Path | Use it when |
| --- | --- |
| **Pubflow Native** | One TypeScript app. UI in `app/pages`, secrets/DB in `app/api`. |
| **Next.js starter** | The frontend is a separate Next app talking to any Flowfull. |
| **TanStack Start starter** | Same split, React + TanStack Start. |
| **flowfull-node + client** | API in Node/Hono, UI somewhere else. |
| **HonoX** | MPA / islands. Native is a client-navigated app (layouts, prefetch). |
| **flowfull-go / python / rust** | The API is not TypeScript. |

Next and TanStack Start both want to own the server (RSC / Nitro). Native keeps **Hono as `fetch`**, the same export flowfull-node already uses on Bun, Node, and Cloudflare Workers. TanStack Router is the file-route library — not TanStack Start.

The UI talks to that process with same-origin HTTP (`/api`, `POST /api/actions`). That is the efficient path: one isolate, JSON, no extra proxy. gRPC (or Hono RPC / `hc`) can live behind Native if another service needs it — it is not a faster replacement for the browser.

The usual failure mode this solves: an AI (or a human) builds a solid UI, then puts `DATABASE_URL` in the client because there is no same-origin API. Native makes that boundary obvious — pages cannot read server env.

**Flowless** is the trust layer when you want login. It knows who the user is and their role. Native does not invent a second auth: it sends the session id to Flowless (`POST /auth/bridge/validate`) and uses that identity. Then `requireAuth` / `requireRole` limit routes and Actions. Skip Flowless and Native is still React + Hono. See [Auth](./auth.md).

React Native / Expo stays `pubflow create react-native`. Native is web fullstack, not mobile.
