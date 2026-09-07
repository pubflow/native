import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Providers, useTheme } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { canonicalLang, supportedLanguages } from '@/lib/i18n'
import { PUBFLOW_CONFIG } from '@/lib/pubflow-config'

function BrandMark() {
  const { resolved } = useTheme()
  const src = resolved === 'dark' && PUBFLOW_CONFIG.APP_LOGO_DARK ? PUBFLOW_CONFIG.APP_LOGO_DARK : PUBFLOW_CONFIG.APP_LOGO
  if (src) {
    return <img src={src} alt={PUBFLOW_CONFIG.APP_NAME} className="h-7 w-auto" />
  }
  return <span className="font-semibold">{PUBFLOW_CONFIG.APP_NAME}</span>
}

function Shell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { resolved, setTheme } = useTheme()
  const lang = canonicalLang(i18n.resolvedLanguage || i18n.language)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-semibold">
            <BrandMark />
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="rounded-md px-3 py-1.5 text-sm hover:bg-muted">
              {t('nav.login')}
            </Link>
            <Link to="/dashboard" className="rounded-md px-3 py-1.5 text-sm hover:bg-muted">
              {t('nav.dashboard')}
            </Link>
            <Button variant="outline" size="sm" onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}>
              {resolved === 'dark' ? t('theme.light') : t('theme.dark')}
            </Button>
            {PUBFLOW_CONFIG.LANGUAGE_LOCKED ? null : (
              <select
                aria-label={t('nav.language')}
                className="h-8 rounded-md border border-border bg-background px-3 text-xs font-medium"
                value={lang}
                onChange={(event) => {
                  const next = canonicalLang(event.target.value)
                  void i18n.changeLanguage(next)
                  window.localStorage.setItem('i18nextLng', next)
                }}
              >
                {supportedLanguages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <Shell>{children}</Shell>
    </Providers>
  )
}
