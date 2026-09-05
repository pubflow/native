import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PUBFLOW_CONFIG } from '@/lib/pubflow-config'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { token?: string }
  const token = search.token || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      if (password.length < 6) throw new Error(t('passwordReset.passwordLength'))
      if (password !== confirm) throw new Error(t('passwordReset.mismatch'))
      const response = await fetch(`${PUBFLOW_CONFIG.API_BASE_URL.replace(/\/$/, '')}/auth/password-reset/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(data.error || data.message || t('passwordReset.resetError'))
      }
      navigate({ to: '/login', search: { message: t('passwordReset.success') } as never })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordReset.resetError'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('passwordReset.resetTitle')}</CardTitle>
          <CardDescription>{t('passwordReset.resetSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? <p className="mb-3 text-sm text-muted-foreground">{t('passwordReset.missingToken')}</p> : null}
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordReset.newPassword')}</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t('passwordReset.confirmPassword')}</Label>
              <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={pending || !token}>
              {pending ? t('status.loading') : t('passwordReset.resetSubmit')}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
