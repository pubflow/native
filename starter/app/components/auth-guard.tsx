import { useEffect, type ReactNode } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@pubflow/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'

export function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { t } = useTranslation()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login', search: { redirect: pathname } as never })
    }
  }, [isAuthenticated, isLoading, navigate, pathname])

  if (isLoading || !isAuthenticated) {
    return (
      <main className="grid min-h-[50vh] place-items-center p-6">
        <Card className="flex items-center gap-3 p-6">
          <ShieldCheck size={28} />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('status.protected')}</p>
            <h1 className="text-lg font-semibold">{isLoading ? t('status.loading') : t('status.redirecting')}</h1>
          </div>
        </Card>
      </main>
    )
  }

  return <>{children}</>
}
