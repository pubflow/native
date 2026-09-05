import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { detectMailTransport, interpolate, loadMailTemplate, readBranding, sendMail } from './mail.ts'

describe('mail detect', () => {
  it('picks SMTP_URL, then host+user, then Zepto, else off', () => {
    expect(detectMailTransport({ SMTP_URL: 'smtp://u:p@mail.example:465' }).kind).toBe('smtp-url')
    expect(detectMailTransport({ SMTP_HOST: 'smtp.example', SMTP_USERNAME: 'u', SMTP_PASSWORD: 'p' }).kind).toBe(
      'smtp-host',
    )
    expect(detectMailTransport({ ZEPTOMAIL_API_KEY: 'z' }).kind).toBe('zepto')
    expect(detectMailTransport({}).kind).toBe('off')
    expect(detectMailTransport({ MOCK_EMAIL: 'true', SMTP_URL: 'smtp://x' }).kind).toBe('mock')
  })

  it('reads branding only when set', () => {
    expect(readBranding({}).name).toBe('')
    expect(readBranding({ BRAND_NAME: 'Acme', MAIL_FROM: 'a@acme.test' }).from).toBe('a@acme.test')
  })

  it('skips send when mail is off', async () => {
    const result = await sendMail({ to: 'a@b.c', subject: 'Hi', html: '<p>x</p>' }, { env: {} })
    expect(result).toEqual({ sent: false, skipped: 'off' })
  })

  it('loads welcome templates and interpolates branding', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'native-mail-'))
    fs.mkdirSync(path.join(root, 'app', 'mail', 'en'), { recursive: true })
    fs.writeFileSync(path.join(root, 'app', 'mail', 'en', 'welcome.html'), '<p>Hi {{name}} from {{brand_name}}</p>')
    const loaded = loadMailTemplate('welcome', 'en', root)
    expect(loaded?.html).toContain('{{name}}')
    expect(interpolate(loaded!.html, { name: 'Ada', brand_name: 'Acme' })).toBe('<p>Hi Ada from Acme</p>')
    fs.rmSync(root, { recursive: true, force: true })
  })
})
