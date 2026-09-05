export type ActionSession = {
  user_id: string
  email?: string
  name?: string
  user_type?: string
}

const ANY_TYPES = new Set(['any', 'authenticated', '*'])

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
