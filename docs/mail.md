# Mail

`import { sendMail, sendLocalizedEmail } from '@pubflow/native/mail'`

First env present wins:

1. `MOCK_EMAIL=true` — log, do not send
2. `SMTP_URL`
3. `SMTP_HOST` + `SMTP_USERNAME` / `SMTP_PASSWORD`
4. `ZEPTOMAIL_API_KEY`
5. none — `{ sent: false, skipped: 'off' }` (the app does not crash)

No MCU (`EMAIL_TEMPLATES=email://…`) in Native.

Templates live in the app: `app/mail/<lang>/<name>.html`. `{{name}}`, `{{brand_name}}`, `{{brand_email}}`, `{{brand_logo_url}}`, `{{brand_primary}}`, … Language: argument → `GLOBAL_LANG` / `DEFAULT_LANGUAGE` → `en`, then `app/mail/en/`.

Branding (plain env, skip if empty): `BRAND_NAME`, `BRAND_ADDRESS`, `BRAND_EMAIL`, `BRAND_LOGO_URL`, `BRAND_LOGO_DARK_URL`, `MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO`, `BRAND_PRIMARY` (HTML only — does not change Tailwind).

Default starter: `app/mail/en/welcome.html` and `es/`, re-export `app/lib/mail.ts`. Needs `nodemailer` for SMTP (listed on Default).
