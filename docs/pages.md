# Pages

Files under `app/pages` become TanStack Router routes. You export a React component. You do not write `createFileRoute`.

A folder is a URL segment. `index.tsx` is that folder’s page. A sibling file is another segment.

| File | URL |
| --- | --- |
| `app/pages/index.tsx` | `/` |
| `app/pages/about.tsx` | `/about` |
| `app/pages/products.tsx` | `/products` |
| `app/pages/products/index.tsx` | `/products` (same URL — pick one) |
| `app/pages/products/[id].tsx` | `/products/$id` |
| `app/pages/products/[id]/index.tsx` | `/products/$id` |
| `app/pages/products/[id]/edit.tsx` | `/products/$id/edit` |
| `app/pages/products/layout.tsx` | layout for `/products/*` |
| `error.tsx` / `pending.tsx` | optional error / pending UI |

`products.tsx` and `products/index.tsx` are the same route. Use the file when it is one page. Use the folder when you need `[id]`, layout, or siblings. If both exist, **the folder wins** and Native warns once (the leaf file is ignored).

`[id]` in a file name or folder name is a path param (`$id`). Nested `[id]/edit.tsx` works.

## Params (`id` and friends)

Native passes path params as **props**. No import:

```tsx
// app/pages/items/[id].tsx → /items/$id
export default function ItemPage({ id }: { id: string }) {
  // fetch(`/api/items/${id}`) or call an Action
}
```

Layouts receive the same params plus `children`.

If you prefer hooks, skip the props and import:

```tsx
import { usePathParams } from '@pubflow/native'
import { useSearch } from '@tanstack/react-router'

const { id } = usePathParams<{ id: string }>()
const search = useSearch({ strict: false })
```

`useParams` from `@tanstack/react-router` also works. Search params are never mixed into props.

Params are the URL. **Data is not automatic** — call `/api/*` or an Action. Pages cannot read `DATABASE_URL`.

```tsx
import { Link } from '@tanstack/react-router'

<Link to="/items/$id" params={{ id: item.id }}>
  {item.name}
</Link>
```

## API contrast

A page is React. An API file is a **Hono app**: you write `.get` / `.post`. Dynamic segments on the server are Hono params:

```ts
users.get('/:id', (c) => c.json({ id: c.req.param('id') }))
```

See [API](./api.md) and [Backend](./backend.md).

Generated files live in `.pubflow/generated/` (gitignored). Do not mix them with `.pubflow/context/` used by the CLI.
