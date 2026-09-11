import fs from 'node:fs'
import path from 'node:path'
import { forbidClient } from './client-guard.ts'

forbidClient('@pubflow/native/mail')

export type MailTransport =
  | { kind: 'off' }
  | { kind: 'mock' }
  | { kind: 'smtp-url'; url: string }
  | { kind: 'smtp-host'; host: string; port: number; user?: string; pass?: string; secure: boolean }
  | { kind: 'zepto'; apiKey: string }

export type MailMessage = {
  to: string
  subject: string
  html: string
  text?: string
  lang?: string
  template?: string
  vars?: Record<string, string>
}

export type Branding = {
  name: string
  address: string
  email: string
  logoUrl: string
  logoDarkUrl: string
  from: string
  fromName: string
  replyTo: string
  primary: string
}

function env(name: string, fallback = '', source: NodeJS.ProcessEnv = process.env): string {
  return (source[name] || '').trim() || fallback
}

export function detectMailTransport(source: NodeJS.ProcessEnv = process.env): MailTransport {
  if (source.MOCK_EMAIL === 'true') return { kind: 'mock' }
  const smtpUrl = env('SMTP_URL', '', source)
  if (smtpUrl) return { kind: 'smtp-url', url: smtpUrl }
  const host = env('SMTP_HOST', '', source)
  const user = env('SMTP_USERNAME', '', source) || env('SMTP_USER', '', source)
  const pass = env('SMTP_PASSWORD', '', source) || env('SMTP_PASS', '', source)
  if (host && user) {
    const port = Number(env('SMTP_PORT', '587', source)) || 587
    return { kind: 'smtp-host', host, port, user, pass, secure: port === 465 }
  }
  const zepto = env('ZEPTOMAIL_API_KEY', '', source)
  if (zepto) return { kind: 'zepto', apiKey: zepto }
  return { kind: 'off' }
}

export function readBranding(source: NodeJS.ProcessEnv = process.env): Branding {
  const name = env('BRAND_NAME', '', source) || env('PUBFLOW_PUBLIC_APP_NAME', '', source)
  const from = env('MAIL_FROM', '', source) || env('BRAND_EMAIL', '', source)
  return {
    name,
    address: env('BRAND_ADDRESS', '', source),
    email: env('BRAND_EMAIL', '', source),
    logoUrl: env('BRAND_LOGO_URL', '', source) || env('PUBFLOW_PUBLIC_APP_LOGO', '', source),
    logoDarkUrl: env('BRAND_LOGO_DARK_URL', '', source) || env('PUBFLOW_PUBLIC_APP_LOGO_DARK', '', source),
    from,
    fromName: env('MAIL_FROM_NAME', '', source) || name,
    replyTo: env('MAIL_REPLY_TO', '', source),
    primary: env('BRAND_PRIMARY', '', source),
  }
}

export function interpolate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? '')
}

function brandingVars(brand: Branding): Record<string, string> {
  const vars: Record<string, string> = {}
  if (brand.name) vars.brand_name = brand.name
  if (brand.address) vars.brand_address = brand.address
  if (brand.email) vars.brand_email = brand.email
  if (brand.logoUrl) vars.brand_logo_url = brand.logoUrl
  if (brand.logoDarkUrl) vars.brand_logo_dark_url = brand.logoDarkUrl
  if (brand.primary) vars.brand_primary = brand.primary
  return vars
}

export function resolveMailLang(lang?: string, source: NodeJS.ProcessEnv = process.env): string {
  const fromArg = (lang || '').toLowerCase().slice(0, 2)
  if (fromArg) return fromArg
  const fallback = (source.GLOBAL_LANG || source.DEFAULT_LANGUAGE || 'en').toLowerCase().slice(0, 2)
  return fallback || 'en'
}

export function loadMailTemplate(
  template: string,
  lang?: string,
  root = process.cwd(),
): { html: string; lang: string } | null {
  const resolved = resolveMailLang(lang)
  const dirs = [path.join(root, 'app', 'mail', resolved), path.join(root, 'app', 'mail', 'en')]
  for (const dir of dirs) {
    const file = path.join(dir, `${template}.html`)
    if (fs.existsSync(file)) {
      return { html: fs.readFileSync(file, 'utf8'), lang: dir.endsWith(`${path.sep}en`) && resolved !== 'en' ? 'en' : resolved }
    }
  }
  return null
}

function subjectFromHtml(html: string, fallback: string): string {
  const title = html.match(/<title>([^<]+)<\/title>/i)
  return title?.[1]?.trim() || fallback
}

async function sendSmtp(transport: MailTransport, from: string, fromName: string, replyTo: string, message: MailMessage) {
  type Smtp = { sendMail: (opts: unknown) => Promise<unknown> }
  type NodemailerApi = {
    createTransport?: (opts: unknown) => Smtp
    default?: { createTransport?: (opts: unknown) => Smtp }
  }
  const spec = 'nodemailer'
  let nodemailer: NodemailerApi
  try {
    nodemailer = (await import(spec)) as NodemailerApi
  } catch {
    throw new Error('Install nodemailer to send SMTP mail')
  }
  const createTransport = nodemailer.createTransport || nodemailer.default?.createTransport
  if (!createTransport) throw new Error('Install nodemailer to send SMTP mail')
  const options =
    transport.kind === 'smtp-url'
      ? transport.url
      : transport.kind === 'smtp-host'
        ? {
            host: transport.host,
            port: transport.port,
            secure: transport.secure,
            auth: transport.user ? { user: transport.user, pass: transport.pass } : undefined,
          }
        : null
  if (!options) return
  const sender = createTransport(options)
  await sender.sendMail({
    from: fromName ? `"${fromName}" <${from}>` : from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: replyTo || undefined,
  })
}

async function sendZepto(apiKey: string, from: string, fromName: string, replyTo: string, message: MailMessage) {
  const response = await fetch('https://api.zeptomail.com/v1.1/email', {
    method: 'POST',
    headers: {
      Authorization: `Zoho-enczapikey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { address: from, name: fromName || undefined },
      to: [{ email_address: { address: message.to } }],
      subject: message.subject,
      htmlbody: message.html,
      textbody: message.text,
      reply_to: replyTo ? [{ address: replyTo }] : undefined,
    }),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`ZeptoMail failed (${response.status}): ${body.slice(0, 200)}`)
  }
}

export type SendMailResult = { sent: boolean; skipped?: 'off' | 'mock' }

export async function sendMail(
  input: MailMessage,
  options: { env?: NodeJS.ProcessEnv; root?: string } = {},
): Promise<SendMailResult> {
  const source = options.env || process.env
  const transport = detectMailTransport(source)
  if (transport.kind === 'off') return { sent: false, skipped: 'off' }

  const brand = readBranding(source)
  let html = input.html
  let subject = input.subject
  if (input.template) {
    const loaded = loadMailTemplate(input.template, input.lang, options.root)
    if (loaded) {
      html = interpolate(loaded.html, { ...brandingVars(brand), ...(input.vars || {}) })
      if (!input.subject) subject = subjectFromHtml(loaded.html, input.template)
    }
  } else if (input.vars) {
    html = interpolate(html, { ...brandingVars(brand), ...input.vars })
  }

  const message: MailMessage = { ...input, html, subject: subject || input.template || 'Message' }
  if (transport.kind === 'mock') {
    console.info(`[pubflow-native] MOCK_EMAIL to=${message.to} subject=${message.subject}`)
    return { sent: false, skipped: 'mock' }
  }

  const from = brand.from
  if (!from) throw new Error('MAIL_FROM or BRAND_EMAIL is required to send mail')

  if (transport.kind === 'zepto') {
    await sendZepto(transport.apiKey, from, brand.fromName, brand.replyTo, message)
    return { sent: true }
  }
  await sendSmtp(transport, from, brand.fromName, brand.replyTo, message)
  return { sent: true }
}

export async function sendLocalizedEmail(
  input: Omit<MailMessage, 'html' | 'subject'> & { template: string; subject?: string; html?: string },
  options?: { env?: NodeJS.ProcessEnv; root?: string },
): Promise<SendMailResult> {
  return sendMail(
    {
      to: input.to,
      template: input.template,
      lang: input.lang,
      vars: input.vars,
      subject: input.subject || '',
      html: input.html || '',
    },
    options,
  )
}
