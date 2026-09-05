# Upgrade

`@pubflow/native` is an npm package. Cloning a starter copies that app’s `package.json`. Publishing a new library version does **not** rewrite apps you already created.

## 1.0.0

Templates now use `"@pubflow/native": "^1.0.0"` (`>=1.0.0 <2.0.0`). Apps still on `^0.1.6` **do not** jump to 1.0 on `bun install`. Opt in:

```bash
bun add @pubflow/native@1.0.0
```

1.0 adds optional subpaths (`./db`, `./cache`, `./mail`, `./rate-limit`, `./http`). Core 0.1 (vite, pages, api, auth) stays. Generated CORS uses `corsFromEnv()` instead of open `cors()`. `requireAuth` binds IP/UA when `AUTH_VALIDATION_MODE` is not `DISABLED`.

Do not put `"latest"` in `package.json`.

## Ranges

| You publish | Existing app with `^1.0.0` |
| --- | --- |
| `1.0.1` / `1.1.0` | Yes — `bun update` |
| `2.0.0` | **No** |

Old apps with `^0.1.6` stay on 0.1.x until they change `package.json`.
