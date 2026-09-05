# Database

`import { getDb, parseDatabaseUrl } from '@pubflow/native/db'`

One `DATABASE_URL`. Empty → do not call `getDb()` (the Default starter still boots).

| URL | Provider |
| --- | --- |
| `postgres://` host `*.neon.tech` | neon |
| `postgres://` / `postgresql://` | postgres |
| `mysql://` host `*.psdb.cloud` | planetscale |
| `mysql://` | mysql |
| `libsql://` / `file:` | turso / libsql |

`DATABASE_PROVIDER=` overrides detection (`postgres`, `mysql`, `neon`, `planetscale`, `libsql`).

Turso: put `authToken` (or `token` / `auth_token`) on the URL query. Native strips it before connecting. `TURSO_AUTH_TOKEN` is a code fallback — keep it out of `.env.example`.

Needs optional peers: `kysely` plus `pg`, `mysql2`, or `@libsql/kysely-libsql`. The Default starter lists them. Minimal does not.

Default starter re-exports from `app/lib/db.ts`. There is **no** local users table — identity stays in Flowless.
