# Cache and rate limit

`import { getHybridCache } from '@pubflow/native/cache'`
`import { rateLimit, rateLimitPresets } from '@pubflow/native/rate-limit'`

- No `REDIS_URL` (and no `REDIS_HOST`) → in-process LRU
- Redis configured → **Redis only** (not dual-write)
- Redis configured but down → temporary LRU, with a warning

Keys are strings. `set(key, value, ttlSeconds)`.

Rate limit is **opt-in**. Put it on the route you care about — Native does not apply it globally.

```ts
import { rateLimit } from '@pubflow/native/rate-limit'

products.get('/', rateLimit({ max: 60, windowSeconds: 60 }), (c) => c.json(listProducts()))
```

Presets: `login` (5 / 15 min), `api` (120 / 60s). Uses `getClientIp`, or `X-Session-ID` when `key: 'session'`.
