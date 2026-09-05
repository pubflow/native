import { FormEvent, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PUBFLOW_CONFIG } from '@/lib/pubflow-config'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    setSuccess('')
    try {
      const resetUrl = `${window.location.origin}/reset-password`
      const response = await fetch(`${PUBFLOW_CONFIG.API_BASE_URL.replace(/\/$/, '')}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), resetUrl }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(data.error || data.message || t('passwordReset.requestError'))
      }
      setSuccess(t('passwordReset.sent'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordReset.requestError'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('passwordReset.title')}</CardTitle>
          <CardDescription>{t('passwordReset.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          {success ? <p className="mb-3 text-sm text-muted-foreground">{success}</p> : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t('status.loading') : t('passwordReset.submit')}
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
