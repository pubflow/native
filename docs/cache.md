# Cache and rate limit

`import { getHybridCache } from '@pubflow/native/cache'`
`import { rateLimit, rateLimitPresets } from '@pubflow/native/rate-limit'`

- No `REDIS_URL` (and no `REDIS_HOST`) → in-process LRU
- Redis configured → **Redis only** (not dual-write)
- Redis configured but down → temporary LRU, with a warning

Keys are strings. `set(key, value, ttlSeconds)`.

Rate limit middleware uses `getClientIp` (or `X-Session-ID` when `key: 'session'`). Presets: `login` (5 / 15 min), `api` (120 / 60s). The Default starter applies the API preset in `app/api/_middleware.ts`.
