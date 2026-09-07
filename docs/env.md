# Environment

Keep `.env.example` short. Copy it, fill what you use, ignore the rest. Native assumes defaults.

## What the starter lists

**Browser** (`PUBFLOW_PUBLIC_*` or `VITE_*` — same keys):

- `FLOWLESS_URL` — Flowless origin
- `BRIDGE_SECRET` — public bridge string (same value as the server secret)
- `APP_NAME`, `DEFAULT_THEME` (`system` / `light` / `dark`)
- Optional: `DEFAULT_LANGUAGE` (locks one language, hides the toggle), `APP_LOGO`, `APP_LOGO_DARK`

**Server (unprefixed — Vite never inlines these):**

- `FLOWLESS_URL`, `BRIDGE_SECRET` — same strings as above. Native only needs the Flowless **URL** and the bridge secret. Do not copy Flowless `AUTH=`, `TOKENS=`, or `EMAIL_TEMPLATES=` here.
- `PORT` — default `3000`
- `DATABASE_URL` — empty is fine; the app starts without a database
- `AUTH_VALIDATION_MODE` — `DISABLED` | `STANDARD` | `ADVANCED` | `STRICT` (see [Security](./security.md))
- `CORS_ORIGINS` — comma list. Empty: localhost in dev, same-origin in production

**Optional, commented:**

- `REDIS_URL` — if set, cache and rate-limit use Redis only
- Mail: `SMTP_URL` **or** `SMTP_HOST` + `SMTP_USERNAME` + `SMTP_PASSWORD` **or** `ZEPTOMAIL_API_KEY` (first present wins). No mail env → send is skipped
- Branding: `BRAND_NAME`, `BRAND_EMAIL`, `BRAND_LOGO_URL`, `BRAND_LOGO_DARK_URL`, `MAIL_FROM`

## Not in the example (on purpose)

`NEON_DATABASE_URL`, `PLANETSCALE_DATABASE_URL`, `TURSO_*`, `CORS_METHODS`, `CORS_HEADERS`, `AUTH_IP_VALIDATION`, `AUTH_AUTO_INVALIDATE`, MCU URLs. Put Neon / PlanetScale / Turso in **`DATABASE_URL`**. Turso token: `?authToken=` on that URL (or `TURSO_AUTH_TOKEN` if you must).

See [Database](./db.md), [Hyperdrive](./hyperdrive.md) (Workers + Postgres/MySQL only), [Cache](./cache.md), [Mail](./mail.md), [Security](./security.md).
