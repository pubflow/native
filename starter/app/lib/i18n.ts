import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from '@/locales/en/common.json'
import esCommon from '@/locales/es/common.json'
import { PUBFLOW_CONFIG } from './pubflow-config'

export const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const

export type SupportedLang = (typeof supportedLanguages)[number]['code']

const fallbackLang: SupportedLang = 'en'
const supportedCodes: SupportedLang[] = supportedLanguages.map((item) => item.code)

const resources = {
  en: { common: enCommon },
  es: { common: esCommon },
}

export function canonicalLang(raw?: string | null): SupportedLang {
  const value = String(raw || '')
    .toLowerCase()
    .replace('_', '-')
  const exact = supportedCodes.find((code) => value === code)
  if (exact) return exact
  const prefix = supportedCodes.find((code) => value.startsWith(`${code}-`))
  if (prefix) return prefix
  return fallbackLang
}

/** After hydrate. SSR and the first client paint stay on `en` (or the locked language). */
export function detectClientLang(): SupportedLang {
  if (typeof window === 'undefined') return fallbackLang
  const stored = window.localStorage.getItem('i18nextLng')
  if (stored) return canonicalLang(stored)
  return canonicalLang(window.navigator.language)
}

const startLang = PUBFLOW_CONFIG.LANGUAGE_LOCKED
  ? canonicalLang(PUBFLOW_CONFIG.DEFAULT_LANGUAGE)
  : fallbackLang

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: startLang,
    fallbackLng: fallbackLang,
    supportedLngs: [...supportedCodes],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
}

export { i18n }
