# Pages

Files under `app/pages` use Next-like names. The Vite plugin maps them to TanStack Router. You do not write `createFileRoute`.

| File | Route |
| --- | --- |
| `layout.tsx` | Nested layout (`children` / `Outlet`) |
| `index.tsx` | Index of that folder |
| `[id].tsx` | Param (`$id`) |
| `error.tsx` / `pending.tsx` | Optional error / pending UI |

Default export is the page or layout.

```tsx
// app/pages/dashboard/index.tsx
import { useAuth } from '@pubflow/react'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}
```

Generated files live in `.pubflow/generated/` (gitignored). Do not mix them with `.pubflow/context/` used by the CLI.
