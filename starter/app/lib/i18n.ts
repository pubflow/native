import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enCommon from '@/locales/en/common.json'
import esCommon from '@/locales/es/common.json'
import { PUBFLOW_CONFIG } from './pubflow-config'

const resources = {
  en: { common: enCommon },
  es: { common: esCommon },
}

if (!i18n.isInitialized) {
  i18n.use(LanguageDetector).use(initReactI18next).init({
    resources,
    fallbackLng: 'en',
    lng: PUBFLOW_CONFIG.DEFAULT_LANGUAGE,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })
}

export { i18n }
