# Backend

Native is a **full-stack app**: one process, one deploy. Starters are the entry. When the API grows, you still write Hono — you split modules.

The file under `app/api` is the HTTP edge. Queries, schemas, and rules live in `app/lib` (or whatever folder you want **outside** `app/api`). Vite already aliases `@/` → `app/` in Default, Minimal, and Custom Hono.

```
app/api/v1/products.ts      thin Hono — import from lib
app/api/v2/products.ts      another HTTP contract, same service
app/lib/products/service.ts list / get (memory, SQL, …)
app/server.ts               optional — you own fetch ([Custom Hono](../examples/custom-hono-server))
```

```ts
// app/lib/products/service.ts
export function listProducts() {
  return [{ id: '1', name: 'Bolt' }]
}

export function getProduct(id: string) {
  return listProducts().find((item) => item.id === id) ?? null
}
```

```ts
// app/api/v1/products.ts → /api/v1/products
import { Hono } from 'hono'
import { listProducts, getProduct } from '@/lib/products/service'

const products = new Hono()
products.get('/', (c) => c.json(listProducts()))
products.get('/:id', (c) => {
  const item = getProduct(c.req.param('id'))
  if (!item) return c.json({ error: 'not found' }, 404)
  return c.json(item)
})
export default products
```

`app/api/v2/products.ts` can import the same service and change status codes or the JSON shape. Versioning is a folder (`v1` / `v2`) or one Hono parent that calls `route('/products', productsRouter)`.

You can also compose inside one file:

```ts
products.route('/admin', adminProducts)
```

`adminProducts` can live in `app/lib/products/admin.ts` as a Hono router **without** a `default` export under `app/api` — so it is not mounted twice.

## Do not put domain code in `app/api`

Every `app/api/**/*.ts` file is globbed. If it `export default` a Hono app, Native mounts it.

- `app/api/products/queries.ts` with a Hono default → `/api/products/queries`
- `app/api/v1/_lib/db.ts` — skipped (`_` except `_middleware`)
- `app/lib/products/service.ts` — never a mount

Keep tests out of `app/api/`. Prefer `app/lib` for anything that is not a route or `_middleware`.

Pages stay thin the same way: `app/pages/items/[id].tsx` receives `{ id }` and `fetch`es `/api/items/${id}`. See [Pages](./pages.md).

## Custom `app/server.ts`

When this file exists, it **replaces** the generated handler. Use it for CORS, extra paths (`/rpc`), OpenAPI, or to mount globbed APIs yourself. See [API](./api.md) and [`examples/custom-hono-server`](../examples/custom-hono-server).
