import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <div className="space-y-3">
        <Badge>{t('app.tagline')}</Badge>
        <h1 className="text-4xl font-black tracking-tight">{t('home.welcome.title')}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{t('home.welcome.subtitle')}</p>
        <div className="flex gap-3">
          <Link to="/login">
            <Button>{t('actions.goLogin')}</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">{t('actions.openDashboard')}</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('home.welcome.editTitle')}</CardTitle>
            <CardDescription>{t('home.welcome.steps.home')}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{t('home.welcome.steps.auth')}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>app/pages</CardTitle>
            <CardDescription>{t('home.welcome.steps.config')}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>app/api</CardTitle>
            <CardDescription>{t('home.welcome.editSubtitle')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  )
}
