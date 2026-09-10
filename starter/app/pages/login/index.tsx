import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@pubflow/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getRedirectUrl } from '@/lib/pubflow-config'

type LoginStep = 'credentials' | 'otp'
type TwoFactorMethod = { id: string; method: string; identifier?: string }

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string; message?: string }
  const auth = useAuth() as ReturnType<typeof useAuth> & {
    verifyTwoFactor: (methodId: string, code: string) => Promise<{ verified?: boolean; session_activated?: boolean; error?: string }>
    startTwoFactor: (methodId: string, method: string) => Promise<unknown>
    twoFactorMethods?: TwoFactorMethod[]
  }
  const { login, isAuthenticated, isLoading, verifyTwoFactor, startTwoFactor, twoFactorMethods = [] } = auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState<LoginStep>('credentials')
  const [pendingMethods, setPendingMethods] = useState<TwoFactorMethod[]>([])
  const [activeMethodId, setActiveMethodId] = useState('')
  const redirectPath = search.redirect && search.redirect !== '/login' ? search.redirect : getRedirectUrl()

  const methods = pendingMethods.length ? pendingMethods : twoFactorMethods
  const activeMethod = useMemo(
    () => methods.find((method) => method.id === activeMethodId) || methods[0],
    [activeMethodId, methods],
  )

  useEffect(() => {
    if (step === 'otp') return
    if (!isLoading && isAuthenticated) navigate({ to: redirectPath as never })
  }, [isAuthenticated, isLoading, navigate, redirectPath, step])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const result = await login({ email: email.trim().toLowerCase(), password })
      if (result?.requires2fa) {
        const nextMethods: TwoFactorMethod[] = result.availableMethods || twoFactorMethods || []
        setPendingMethods(nextMethods)
        setActiveMethodId(nextMethods[0]?.id || '')
        setOtp('')
        setStep('otp')
        // Flowless already sent the OTP on login. Do not auto-call startTwoFactor.
        return
      }
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

  async function onVerify(event: FormEvent) {
    event.preventDefault()
    if (!activeMethod?.id) {
      setError(t('login.noMethod'))
      return
    }
    if (otp.trim().length < 4) {
      setError(t('login.otpRequired'))
      return
    }
    setPending(true)
    setError('')
    try {
      const result = await verifyTwoFactor(activeMethod.id, otp.trim())
      if (!(result.verified || result.session_activated)) {
        setError(result.error || t('login.invalidCode'))
        return
      }
      navigate({ to: redirectPath as never })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.verifyFailed'))
    } finally {
      setPending(false)
    }
  }

  async function onResend() {
    if (!activeMethod?.id) {
      setError(t('login.noMethod'))
      return
    }
    setPending(true)
    setError('')
    try {
      await startTwoFactor(activeMethod.id, activeMethod.method)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.resendFailed'))
    } finally {
      setPending(false)
    }
  }

  function backToCredentials() {
    setStep('credentials')
    setOtp('')
    setPendingMethods([])
    setActiveMethodId('')
    setError('')
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{step === 'otp' ? t('login.otpTitle') : t('login.title')}</CardTitle>
          <CardDescription>{step === 'otp' ? t('login.otpSubtitle') : t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {search.message && step === 'credentials' ? (
            <p className="mb-3 text-sm text-muted-foreground">{search.message}</p>
          ) : null}
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}

          {step === 'otp' ? (
            <form className="space-y-4" onSubmit={onVerify}>
              {methods.length > 1 ? (
                <div className="space-y-2">
                  <Label htmlFor="method">{t('login.method')}</Label>
                  <select
                    id="method"
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    value={activeMethodId}
                    disabled={pending}
                    onChange={(event) => {
                      setActiveMethodId(event.target.value)
                      setOtp('')
                      setError('')
                    }}
                  >
                    {methods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.method.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="otp">{t('login.codeLabel', { method: activeMethod?.method || 'email' })}</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="000000"
                  maxLength={8}
                  disabled={pending}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending || otp.length < 4}>
                {pending ? t('status.loading') : t('login.verify')}
              </Button>
              <div className="flex justify-between text-sm">
                <button type="button" className="text-primary underline" disabled={pending} onClick={() => void onResend()}>
                  {t('login.resend')}
                </button>
                <button type="button" className="text-muted-foreground underline" disabled={pending} onClick={backToCredentials}>
                  {t('auth.backToLogin')}
                </button>
              </div>
            </form>
          ) : (
            <>
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
              <p className="mt-3 text-sm text-muted-foreground">
                <Link to="/forgot-password" className="text-primary underline">
                  {t('passwordReset.link')}
                </Link>
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {t('login.noAccount')}{' '}
                <Link to="/register" className="text-primary underline">
                  {t('register.title')}
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
