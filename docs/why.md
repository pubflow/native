# Why Pubflow Native

Native is for TypeScript apps that should not split into a Flowfull backend plus a separate Flowfull client.

| Path | Use it when |
| --- | --- |
| **Pubflow Native** | One TypeScript app. UI in `app/pages`, secrets/DB in `app/api`. |
| **Next.js starter** | The frontend is a separate Next app talking to any Flowfull. |
| **TanStack Start starter** | Same split, React + TanStack Start. |
| **flowfull-node + client** | API in Node/Hono, UI somewhere else. |
| **HonoX** | MPA / islands. Native is a client-navigated app (layouts, prefetch). |
| **flowfull-go / python / rust** | The API is not TypeScript. |

Next and TanStack Start both want to own the server (RSC / Nitro). Native keeps **Hono as `fetch`**, the same export flowfull-node already uses on Bun, Node, Workers, and Deno.

The usual failure mode this solves: an AI (or a human) builds a solid UI, then puts `DATABASE_URL` in the client because there is no same-origin API. Native makes that boundary obvious — pages cannot read server env.

React Native / Expo stays `pubflow create react-native`. Native is web fullstack, not mobile.
