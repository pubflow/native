export type ActionSession = {
  user_id: string
  email?: string
  name?: string
  user_type?: string
}

const ANY_TYPES = new Set(['any', 'authenticated', '*'])
const API_EXT = /\.(ts|js)$/

export function toPosix(value: string): string {
  return value.replace(/\\/g, '/')
}

export function actionId(rel: string, exportName: string): string {
  const parts = toPosix(rel)
    .replace(API_EXT, '')
    .split('/')
    .filter(Boolean)
  const fileBase = parts[parts.length - 1] || exportName
  const dirParts = parts.slice(0, -1)
  if (fileBase === exportName) return [...dirParts, exportName].join('.')
  return [...parts, exportName].join('.')
}

export function parseAllowedTypes(value?: string | string[]): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : String(value).split(',')
  return list.map((item) => item.trim().toLowerCase()).filter(Boolean)
}

/** `any` / `authenticated` / `*` = any signed-in user. Empty list is also "any" once a session exists. */
export function isAnyType(types: string[]): boolean {
  return !types.length || types.some((item) => ANY_TYPES.has(item))
}

export function sessionAllowed(session: ActionSession | undefined, types: string[]): boolean {
  if (!session) return false
  if (isAnyType(types)) return true
  const userType = (session.user_type || '').toLowerCase()
  return types.includes(userType)
}
