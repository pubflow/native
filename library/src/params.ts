import { useParams } from '@tanstack/react-router'

/**
 * Path params for the matched page (`[id].tsx` → `{ id }`).
 * Pages also receive these as props; this hook is the opt-in TanStack-style path.
 * Search params stay on `useSearch` from `@tanstack/react-router`.
 */
export function usePathParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useParams({ strict: false }) as T
}
