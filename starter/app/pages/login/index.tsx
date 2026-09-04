import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@pubflow/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getRedirectUrl } from '@/lib/pubflow-config'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string; message?: string }
  const { login, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const redirectPath = search.redirect && search.redirect !== '/login' ? search.redirect : getRedirectUrl()

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate({ to: redirectPath as never })
  }, [isAuthenticated, isLoading, navigate, redirectPath])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const result = await login({ email, password })
      if (result?.success === false) {
        setError(result.error || t('login.error'))
        return
      }
      navigate({ to: redirectPath as never })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {search.message ? <p className="mb-3 text-sm text-muted-foreground">{search.message}</p> : null}
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t('status.loading') : t('nav.login')}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-primary underline">
              {t('register.title')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
