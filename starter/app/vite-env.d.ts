/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBFLOW_PUBLIC_FLOWLESS_URL?: string
  readonly PUBFLOW_PUBLIC_BRIDGE_SECRET?: string
  readonly PUBFLOW_PUBLIC_BRIDGE_BASE_PATH?: string
  readonly PUBFLOW_PUBLIC_AUTH_BASE_PATH?: string
  readonly PUBFLOW_PUBLIC_APP_NAME?: string
  readonly PUBFLOW_PUBLIC_APP_LOGO?: string
  readonly PUBFLOW_PUBLIC_PRIMARY_COLOR?: string
  readonly PUBFLOW_PUBLIC_SECONDARY_COLOR?: string
  readonly PUBFLOW_PUBLIC_ACCENT_COLOR?: string
  readonly PUBFLOW_PUBLIC_DEFAULT_THEME?: string
  readonly PUBFLOW_PUBLIC_LOGIN_REDIRECT_PATH?: string
  readonly PUBFLOW_PUBLIC_PUBLIC_PATHS?: string
  readonly PUBFLOW_PUBLIC_ENABLE_ACCOUNT_CREATION?: string
  readonly PUBFLOW_PUBLIC_DEFAULT_LANGUAGE?: string
  readonly PUBFLOW_PUBLIC_LOGIN_PROVIDERS?: string
  readonly VITE_FLOWLESS_URL?: string
  readonly VITE_BRIDGE_SECRET?: string
  readonly VITE_BRIDGE_BASE_PATH?: string
  readonly VITE_AUTH_BASE_PATH?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_LOGO?: string
  readonly VITE_PRIMARY_COLOR?: string
  readonly VITE_SECONDARY_COLOR?: string
  readonly VITE_ACCENT_COLOR?: string
  readonly VITE_DEFAULT_THEME?: string
  readonly VITE_LOGIN_REDIRECT_PATH?: string
  readonly VITE_PUBLIC_PATHS?: string
  readonly VITE_ENABLE_ACCOUNT_CREATION?: string
  readonly VITE_DEFAULT_LANGUAGE?: string
  readonly VITE_LOGIN_PROVIDERS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
