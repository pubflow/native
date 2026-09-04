import { publicEnv } from '@pubflow/native/env'

function parseList(value?: string): string[] {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, '').toLowerCase())
    .filter(Boolean)
}

export const PUBFLOW_CONFIG = {
  API_BASE_URL: publicEnv('FLOWLESS_URL') || 'http://localhost:8787',
  BRIDGE_BASE_PATH: publicEnv('BRIDGE_BASE_PATH') || '/bridge',
  AUTH_BASE_PATH: publicEnv('AUTH_BASE_PATH') || '/auth',
  BRIDGE_SECRET: publicEnv('BRIDGE_SECRET') || '',
  APP_NAME: publicEnv('APP_NAME') || 'Pubflow Native',
  APP_LOGO: publicEnv('APP_LOGO') || '',
  PRIMARY_COLOR: publicEnv('PRIMARY_COLOR') || '#006aff',
  SECONDARY_COLOR: publicEnv('SECONDARY_COLOR') || '#4a90e2',
  ACCENT_COLOR: publicEnv('ACCENT_COLOR') || '#06b6d4',
  DEFAULT_THEME: publicEnv('DEFAULT_THEME') || 'system',
  LOGIN_REDIRECT_PATH: publicEnv('LOGIN_REDIRECT_PATH') || '/login',
  PUBLIC_PATHS: publicEnv('PUBLIC_PATHS') || '/login,/register,/',
  ENABLE_ACCOUNT_CREATION: publicEnv('ENABLE_ACCOUNT_CREATION') !== 'false',
  DEFAULT_LANGUAGE: publicEnv('DEFAULT_LANGUAGE') || 'en',
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
