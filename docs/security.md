# Security

Native checks **this process**. Flowless still decides if a session id is valid (`POST /auth/bridge/validate`).

## Client IP

`getClientIp(c)` from `@pubflow/native` / `@pubflow/native/http` is what rate-limit and session bind use.

- Platform IP on `c.env` (`CF_CONNECTING_IP`, `FLY_CLIENT_IP`) always wins — Cloudflare/Fly set this, clients do not.
- `TRUST_PROXY` (default **true in production**, false locally): honor `CF-Connecting-IP`, `True-Client-IP`, `Fly-Client-IP`, `X-Real-IP`, then `X-Forwarded-For` **leftmost**.
- Local / `TRUST_PROXY=false`: ignore forwarded headers. A client sending `X-Forwarded-For: 1.2.3.4` does not steal rate-limit buckets.

Do not set `TRUST_PROXY=true` on a public Node port with no reverse proxy.

## CORS

Generated `app.use('*', corsFromEnv())` (and Custom Hono). Methods and headers are fixed: `GET,POST,PUT,PATCH,DELETE,OPTIONS` and `Content-Type,Authorization,X-Session-ID`. `credentials: true`.

`CORS_ORIGINS` is a comma list. Empty + development → localhost/`127.0.0.1` on `PORT` and `:5173`. Empty + production → same-origin (`APP_URL` / `BASE_URL` or the request `Host`). Never `*` in production.

Same-origin Native (pages + API on one `PORT`) does not need `CORS_ORIGINS`. Set it for a separate front, mobile, or preview URL.

## Session bind (`AUTH_VALIDATION_MODE`)

After Flowless says the session is valid, Native stores `{ ip, userAgent }` in HybridCache for that session id (first request). Later requests compare `getClientIp` + User-Agent to that **Native** snapshot — not Flowless `sessions.ip_address` (the bridge does not return it).

| Mode | Checks | On mismatch |
| --- | --- | --- |
| `DISABLED` | none | — |
| `STANDARD` | IP | log, allow |
| `ADVANCED` | IP + User-Agent | log, allow |
| `STRICT` | IP + User-Agent | **401**, drop local snapshot |

`AUTH_AUTO_INVALIDATE` defaults **false**. Only in **STRICT** + `true` does Native `POST {FLOWLESS_URL}/auth/logout` with that `X-Session-ID` (Flowless deletes DB + cache). If logout fails, the request is still 401. Native never pretends Flowless killed the session without that POST.

STANDARD/ADVANCED do not invalidate: mobile IPs rotate; browsers update User-Agent.

Device fingerprint (`sec-ch-ua`) is off. Override in docs-only env: `AUTH_DEVICE_VALIDATION=true`. Other overrides (`AUTH_IP_VALIDATION`, `AUTH_USER_AGENT_VALIDATION`, `AUTH_LOG_VIOLATIONS`) exist in code, not in `.env.example`.

This is wired inside `createAuth` / `requireAuth`. You do not add a second middleware.
