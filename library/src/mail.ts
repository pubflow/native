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

export type MailTemplateMap = Record<string, string>

export type SendMailOptions = {
  env?: NodeJS.ProcessEnv
  root?: string
  /** Bundled `lang/template` HTML (Workers have no `app/mail` on disk). */
  templates?: MailTemplateMap
}

function env(name: string, fallback = '', source: NodeJS.ProcessEnv = process.env): string {
  const value = (source as Record<string, unknown>)[name]
  return (typeof value === 'string' ? value : '').trim() || fallback
}

function isCloudflareWorker() {
  return typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'
}

export function detectMailTransport(source: NodeJS.ProcessEnv = process.env): MailTransport {
  if (env('MOCK_EMAIL', '', source) === 'true') return { kind: 'mock' }
  const zepto = env('ZEPTOMAIL_API_KEY', '', source)
  const smtpUsable = !isCloudflareWorker()
  if (smtpUsable) {
    const smtpUrl = env('SMTP_URL', '', source)
    if (smtpUrl) return { kind: 'smtp-url', url: smtpUrl }
    const host = env('SMTP_HOST', '', source)
    const user = env('SMTP_USERNAME', '', source) || env('SMTP_USER', '', source)
    const pass = env('SMTP_PASSWORD', '', source) || env('SMTP_PASS', '', source)
    if (host && user) {
      const port = Number(env('SMTP_PORT', '587', source)) || 587
      return { kind: 'smtp-host', host, port, user, pass, secure: port === 465 }
    }
  }
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
  templates?: MailTemplateMap,
): { html: string; lang: string } | null {
  const resolved = resolveMailLang(lang)
  if (templates) {
    const match = templates[`${resolved}/${template}`]
    if (match) return { html: match, lang: resolved }
    const en = templates[`en/${template}`]
    if (en) return { html: en, lang: 'en' }
  }
  try {
    const dirs = [path.join(root, 'app', 'mail', resolved), path.join(root, 'app', 'mail', 'en')]
    for (const dir of dirs) {
      const file = path.join(dir, `${template}.html`)
      if (fs.existsSync(file)) {
        return { html: fs.readFileSync(file, 'utf8'), lang: dir.endsWith(`${path.sep}en`) && resolved !== 'en' ? 'en' : resolved }
      }
    }
  } catch {
    return null
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

function zeptoEndpoint(source: NodeJS.ProcessEnv): string {
  const raw = env('ZEPTOMAIL_API_URL', '', source).replace(/\/$/, '')
  if (!raw) return 'https://api.zeptomail.com/v1.1/email'
  return raw.endsWith('/v1.1/email') ? raw : `${raw}/v1.1/email`
}

export function normalizeZeptoApiKey(apiKey: string): string {
  return apiKey.replace(/^Zoho-enczapikey\s+/i, '').trim()
}

function senderHost(from: string): string {
  const at = from.lastIndexOf('@')
  return at >= 0 ? from.slice(at + 1) : 'none'
}

async function sendZepto(
  apiKey: string,
  from: string,
  fromName: string,
  replyTo: string,
  message: MailMessage,
  source: NodeJS.ProcessEnv,
) {
  const html = (message.html || '').trim()
  const text = (message.text || '').trim()
  if (!html && !text) throw new Error('ZeptoMail: htmlbody or textbody is required')
  const endpoint = zeptoEndpoint(source)
  let host = 'api.zeptomail.com'
  try {
    host = new URL(endpoint).host
  } catch {
    throw new Error('ZEPTOMAIL_API_URL is not a valid URL')
  }
  const fromObj: { address: string; name?: string } = { address: from }
  if (fromName.trim()) fromObj.name = fromName.trim()
  const payload: Record<string, unknown> = {
    from: fromObj,
    to: [{ email_address: { address: message.to } }],
    subject: message.subject,
  }
  if (html) payload.htmlbody = html
  if (text) payload.textbody = text
  if (replyTo.trim()) payload.reply_to = [{ address: replyTo.trim() }]

  console.info('zepto host=' + host, 'fromHost=' + senderHost(from), 'htmlLength=' + html.length)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-enczapikey ${normalizeZeptoApiKey(apiKey)}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error(
      'zepto host=' + host,
      'fromHost=' + senderHost(from),
      'htmlLength=' + html.length,
      'status=' + response.status,
      'body=' + (body.slice(0, 200) || '(empty)'),
    )
    throw new Error(`ZeptoMail failed (${response.status}): ${body.slice(0, 200)}`)
  }
}

export type SendMailResult = { sent: boolean; skipped?: 'off' | 'mock' }

export async function sendMail(input: MailMessage, options: SendMailOptions = {}): Promise<SendMailResult> {
  const source = options.env || process.env
  const transport = detectMailTransport(source)
  if (transport.kind === 'off') return { sent: false, skipped: 'off' }

  const brand = readBranding(source)
  let html = input.html
  let subject = input.subject
  if (input.template) {
    const loaded = loadMailTemplate(input.template, input.lang, options.root, options.templates)
    if (loaded) {
      html = interpolate(loaded.html, { ...brandingVars(brand), ...(input.vars || {}) })
      if (!input.subject) subject = subjectFromHtml(loaded.html, input.template)
    } else if (html && input.vars) {
      html = interpolate(html, { ...brandingVars(brand), ...input.vars })
      if (!input.subject) subject = subjectFromHtml(html, input.template)
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
    await sendZepto(transport.apiKey, from, brand.fromName, brand.replyTo, message, source)
    return { sent: true }
  }
  await sendSmtp(transport, from, brand.fromName, brand.replyTo, message)
  return { sent: true }
}

export async function sendLocalizedEmail(
  input: Omit<MailMessage, 'html' | 'subject'> & { template: string; subject?: string; html?: string },
  options?: SendMailOptions,
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
