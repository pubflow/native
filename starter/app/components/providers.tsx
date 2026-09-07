import { PubflowProvider } from '@pubflow/react'
import { I18nextProvider } from 'react-i18next'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PubflowInstanceConfig } from '@pubflow/core'
import { canonicalLang, detectClientLang, i18n } from '@/lib/i18n'
import { PUBFLOW_CONFIG } from '@/lib/pubflow-config'

export type ThemeMode = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: ThemeMode
  resolved: 'light' | 'dark'
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolved: 'light',
  setTheme: () => undefined,
})

export function useTheme() {
  return useContext(ThemeContext)
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function paintTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(mode)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.classList.toggle('dark', resolved === 'dark')
  root.style.setProperty('--brand-primary', PUBFLOW_CONFIG.PRIMARY_COLOR)
}

const initialTheme: ThemeMode =
  PUBFLOW_CONFIG.DEFAULT_THEME === 'light' || PUBFLOW_CONFIG.DEFAULT_THEME === 'dark'
    ? PUBFLOW_CONFIG.DEFAULT_THEME
    : 'system'

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme)
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    initialTheme === 'dark' ? 'dark' : 'light',
  )

  const setTheme = useCallback((mode: ThemeMode) => {
    paintTheme(mode)
    setResolved(resolveTheme(mode))
    setThemeState(mode)
    if (typeof window !== 'undefined') window.localStorage.setItem('pubflow-native-theme', mode)
  }, [])

  useEffect(() => {
    const stored = window.localStorage.getItem('pubflow-native-theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setTheme(stored)
    } else {
      paintTheme(theme)
      setResolved(resolveTheme(theme))
    }

    if (!PUBFLOW_CONFIG.LANGUAGE_LOCKED) {
      const next = detectClientLang()
      if (canonicalLang(i18n.resolvedLanguage || i18n.language) !== next) {
        void i18n.changeLanguage(next)
        window.localStorage.setItem('i18nextLng', next)
      }
    }
    // First client paint must match SSR; apply stored prefs after hydrate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      paintTheme('system')
      setResolved(resolveTheme('system'))
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
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
        <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
      </PubflowProvider>
    </I18nextProvider>
  )
}
