# with-auth

This folder is **not** a separate app. Auth lives in the official starter (`../../starter`). There is no extra `package.json` here.

```bash
cd ../../starter
cp .env.example .env
```

```
PUBFLOW_PUBLIC_FLOWLESS_URL=http://localhost:8787
FLOWLESS_URL=http://localhost:8787
PUBFLOW_PUBLIC_BRIDGE_SECRET=<same secret Flowless expects>
BRIDGE_VALIDATION_SECRET=<server-side copy used by requireAuth>
```

Run Flowless from `2/canary/flowless` (`POST /auth/bridge/validate`, header `X-Bridge-Secret`). Then `bun run dev` in the starter.
