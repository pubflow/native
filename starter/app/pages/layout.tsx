import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Providers, useTheme } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { PUBFLOW_CONFIG } from '@/lib/pubflow-config'

function Shell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-semibold">
            {PUBFLOW_CONFIG.APP_NAME}
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="rounded-md px-3 py-1.5 text-sm hover:bg-muted">
              {t('nav.login')}
            </Link>
            <Link to="/dashboard" className="rounded-md px-3 py-1.5 text-sm hover:bg-muted">
              {t('nav.dashboard')}
            </Link>
            <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? t('theme.light') : t('theme.dark')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => i18n.changeLanguage(i18n.language?.startsWith('es') ? 'en' : 'es')}
            >
              {i18n.language?.startsWith('es') ? 'EN' : 'ES'}
            </Button>
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
