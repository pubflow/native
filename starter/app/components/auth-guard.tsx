import { useEffect, type ReactNode } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@pubflow/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'

function parseTypes(value?: string | string[]): string[] {
  if (!value) return ['any']
  const list = Array.isArray(value) ? value : String(value).split(',')
  const types = list.map((item) => item.trim().toLowerCase()).filter(Boolean)
  return types.length ? types : ['any']
}

const ANY = new Set(['any', 'authenticated', '*'])

export function AuthGuard({
  children,
  allowedTypes = ['any'],
}: {
  children: ReactNode
  allowedTypes?: string | string[]
}) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, user } = useAuth()
  const types = parseTypes(allowedTypes)
  const userType = String(
    (user as { userType?: string; user_type?: string } | null)?.userType ||
      (user as { userType?: string; user_type?: string } | null)?.user_type ||
      '',
  ).toLowerCase()
  const isAuthorized =
    isAuthenticated && (types.some((item) => ANY.has(item)) || types.includes(userType))

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

  if (!isAuthorized) {
    return (
      <main className="grid min-h-[50vh] place-items-center p-6">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('status.protected')}</p>
          <h1 className="text-lg font-semibold">{t('status.forbidden')}</h1>
        </Card>
      </main>
    )
  }

  return <>{children}</>
}
