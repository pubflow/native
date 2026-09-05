import { useAuth } from '@pubflow/react'
import { useTranslation } from 'react-i18next'
import { AuthGuard } from '@/components/auth-guard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PUBFLOW_CONFIG } from '@/lib/pubflow-config'
import { me as loadSession } from '@/actions/me'
import { ping } from '@/actions/ping'
import { createPost } from '@/actions/posts/createPost'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}

function Dashboard() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [apiUser, setApiUser] = useState<unknown>(null)
  const [actions, setActions] = useState<unknown>(null)

  useEffect(() => {
    const sessionId = window.localStorage.getItem('pubflow_session_id') || window.sessionStorage.getItem('session_id')
    fetch('/api/users', {
      headers: sessionId ? { 'X-Session-ID': sessionId } : {},
    })
      .then((res) => res.json())
      .then(setApiUser)
      .catch(() => setApiUser(null))

    Promise.allSettled([ping(), loadSession(), createPost({ title: 'from dashboard' })])
      .then(([pong, session, post]) =>
        setActions({
          pong: pong.status === 'fulfilled' ? pong.value : { error: String(pong.reason) },
          session: session.status === 'fulfilled' ? session.value : { error: String(session.reason) },
          post: post.status === 'fulfilled' ? post.value : { error: String(post.reason) },
        }),
      )
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('dashboard.subtitle')}</p>
          <h1 className="text-3xl font-bold">
            {t('dashboard.welcome')}, {user?.name || user?.email || t('dashboard.title')}
          </h1>
        </div>
        <Button variant="outline" onClick={() => logout()}>
          {t('nav.logout')}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.cards.auth')}</CardTitle>
            <CardDescription>{t('dashboard.cards.authText')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge>{t('dashboard.signedIn')}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.apiBase')}</CardTitle>
            <CardDescription>{PUBFLOW_CONFIG.API_BASE_URL}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.cards.deploy')}</CardTitle>
            <CardDescription>{t('dashboard.cards.deployText')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.userData')}</CardTitle>
          <CardDescription>{t('dashboard.modules')}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify({ user, apiUser, actions }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
