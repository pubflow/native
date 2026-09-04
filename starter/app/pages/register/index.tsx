import { FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@pubflow/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PUBFLOW_CONFIG } from '@/lib/pubflow-config'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const auth = useAuth() as ReturnType<typeof useAuth> & {
    register?: (input: { email: string; password: string; name?: string }) => Promise<{ success?: boolean; error?: string }>
  }
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      if (typeof auth.register === 'function') {
        const result = await auth.register({ email, password, name })
        if (result?.success === false) {
          setError(result.error || t('register.error'))
          return
        }
      } else {
        const base = PUBFLOW_CONFIG.API_BASE_URL.replace(/\/$/, '')
        const response = await fetch(`${base}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
          throw new Error(data.error || data.message || t('register.error'))
        }
      }
      navigate({ to: '/login', search: { message: t('register.success') } as never })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.error'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('register.title')}</CardTitle>
          <CardDescription>{t('register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">{t('register.name')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t('status.loading') : t('register.submit')}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline">{t('auth.backToLogin')}</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
