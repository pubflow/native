import { bootEnv, publicEnv } from '@pubflow/native/env'

function parseList(value?: string): string[] {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, '').toLowerCase())
    .filter(Boolean)
}

function flowlessUrl() {
  return bootEnv('FLOWLESS_URL') || (import.meta.env.DEV ? 'http://localhost:8787' : '')
}

const lockedLanguage = publicEnv('DEFAULT_LANGUAGE')
const multiLang = publicEnv('MULTI_LANG') !== 'false' && !lockedLanguage

export const PUBFLOW_CONFIG = {
  get API_BASE_URL() {
    return flowlessUrl()
  },
  BRIDGE_BASE_PATH: publicEnv('BRIDGE_BASE_PATH') || '/bridge',
  AUTH_BASE_PATH: publicEnv('AUTH_BASE_PATH') || '/auth',
  get BRIDGE_SECRET() {
    return bootEnv('BRIDGE_SECRET') || ''
  },
  APP_NAME: publicEnv('APP_NAME') || 'Pubflow Native',
  APP_LOGO: publicEnv('APP_LOGO') || '',
  APP_LOGO_DARK: publicEnv('APP_LOGO_DARK') || '',
  PRIMARY_COLOR: publicEnv('PRIMARY_COLOR') || '#006aff',
  SECONDARY_COLOR: publicEnv('SECONDARY_COLOR') || '#4a90e2',
  ACCENT_COLOR: publicEnv('ACCENT_COLOR') || '#06b6d4',
  DEFAULT_THEME: publicEnv('DEFAULT_THEME') || 'system',
  LOGIN_REDIRECT_PATH: publicEnv('LOGIN_REDIRECT_PATH') || '/login',
  PUBLIC_PATHS: publicEnv('PUBLIC_PATHS') || '/login,/register,/forgot-password,/reset-password,/',
  ENABLE_ACCOUNT_CREATION: publicEnv('ENABLE_ACCOUNT_CREATION') !== 'false',
  DEFAULT_LANGUAGE: lockedLanguage || 'en',
  LANGUAGE_LOCKED: Boolean(lockedLanguage) || publicEnv('MULTI_LANG') === 'false',
  MULTI_LANG: multiLang,
  LOGIN_PROVIDERS: parseList(publicEnv('LOGIN_PROVIDERS')),
}

export function getRedirectUrl(search?: string): string {
  if (!search && typeof window !== 'undefined') search = window.location.search
  const redirect = new URLSearchParams(search || '').get('redirect')
  return redirect && !isPublicPath(redirect) ? redirect : '/dashboard'
}

export function isPublicPath(pathname: string): boolean {
  return PUBFLOW_CONFIG.PUBLIC_PATHS.split(',')
    .map((path) => path.trim())
    .filter(Boolean)
    .some((path) => (path === '/' ? pathname === '/' : pathname.startsWith(path)))
}
