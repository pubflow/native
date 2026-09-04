import { PubflowProvider } from '@pubflow/react'
import { I18nextProvider } from 'react-i18next'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PubflowInstanceConfig } from '@pubflow/core'
import { i18n } from '@/lib/i18n'
import { PUBFLOW_CONFIG } from '@/lib/pubflow-config'

export type ThemeMode = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{ theme: ThemeMode; setTheme: (theme: ThemeMode) => void }>({
  theme: 'system',
  setTheme: () => undefined,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(
    PUBFLOW_CONFIG.DEFAULT_THEME === 'light' || PUBFLOW_CONFIG.DEFAULT_THEME === 'dark'
      ? PUBFLOW_CONFIG.DEFAULT_THEME
      : 'system',
  )

  useEffect(() => {
    const stored = window.localStorage.getItem('pubflow-native-theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') setTheme(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
    root.dataset.theme = resolved
    root.classList.toggle('dark', resolved === 'dark')
    root.style.setProperty('--brand-primary', PUBFLOW_CONFIG.PRIMARY_COLOR)
    window.localStorage.setItem('pubflow-native-theme', theme)
  }, [theme])

  const headers = useMemo(() => {
    if (!PUBFLOW_CONFIG.BRIDGE_SECRET) return undefined
    return { 'X-Bridge-Secret': PUBFLOW_CONFIG.BRIDGE_SECRET }
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      <PubflowProvider
        config={{
          id: 'default',
          baseUrl: PUBFLOW_CONFIG.API_BASE_URL,
          bridgeBasePath: PUBFLOW_CONFIG.BRIDGE_BASE_PATH,
          authBasePath: PUBFLOW_CONFIG.AUTH_BASE_PATH,
          headers,
        } as PubflowInstanceConfig}
      >
        <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
      </PubflowProvider>
    </I18nextProvider>
  )
}
