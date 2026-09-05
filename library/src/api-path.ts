import { toPosix } from './access.ts'

const API_EXT = /\.(ts|js)$/

export type ParsedApiRel = {
  /** Mount under the API app, e.g. `/users` or `/v1/products`. `/` is the API root. */
  mount: string
  isMiddleware: boolean
  /** Underscore helpers (`_lib`, `_queries.ts`) except `_middleware.ts`. */
  skip: boolean
  /** Higher wins when two files collapse to the same mount (folder `index` beats a leaf). */
  rank: number
}

function partsFromRel(rel: string): string[] {
  return toPosix(rel)
    .replace(API_EXT, '')
    .split('/')
    .filter(Boolean)
}

function isSkippedSegment(part: string, isLast: boolean): boolean {
  if (!part.startsWith('_')) return false
  return !(isLast && part === '_middleware')
}

/**
 * File path relative to `app/api` (or a Vite glob key ending in `/app/api/...`).
 * `index` collapses like pages: `products/index.ts` → `/products`.
 */
export function parseApiRel(rel: string): ParsedApiRel {
  const parts = partsFromRel(rel)
  for (let i = 0; i < parts.length; i++) {
    if (isSkippedSegment(parts[i], i === parts.length - 1)) {
      return { mount: '/', isMiddleware: false, skip: true, rank: 0 }
    }
  }

  const last = parts[parts.length - 1] || ''
  if (last === '_middleware') {
    const prefix = parts.slice(0, -1)
    return {
      mount: prefix.length ? `/${prefix.join('/')}` : '/',
      isMiddleware: true,
      skip: false,
      rank: 0,
    }
  }

  const collapsed = last === 'index' ? parts.slice(0, -1) : parts
  const mount = collapsed.length ? `/${collapsed.join('/')}` : '/'
  return {
    mount,
    isMiddleware: false,
    skip: false,
    rank: last === 'index' ? parts.length : 0,
  }
}

export function apiRelFromGlobKey(key: string): string {
  const posix = toPosix(key)
  const marker = '/app/api/'
  const idx = posix.lastIndexOf(marker)
  const rel = idx >= 0 ? posix.slice(idx + marker.length) : posix.split('/app/api/').pop() || posix
  return rel
}

export type ApiMountCandidate<T> = T & { mount: string; rank: number; skip?: boolean; isMiddleware?: boolean }

/** Same mount: keep the folder `index` (higher rank). Leaf files lose. */
export function preferFolderMounts<T extends { mount: string; rank: number; skip?: boolean; isMiddleware?: boolean }>(
  items: T[],
  warn: (dropped: T, kept: T) => void,
): T[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    if (item.skip || item.isMiddleware) continue
    const list = groups.get(item.mount) || []
    list.push(item)
    groups.set(item.mount, list)
  }
  const drop = new Set<T>()
  for (const group of groups.values()) {
    if (group.length < 2) continue
    const ranked = [...group].sort((a, b) => b.rank - a.rank)
    const winner = ranked[0]
    for (const item of ranked.slice(1)) {
      if (item.rank < winner.rank) {
        drop.add(item)
        warn(item, winner)
      }
    }
  }
  return items.filter((item) => !drop.has(item))
}
