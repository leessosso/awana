import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import ko from './locales/ko.json'

export const defaultNS = 'common'

void i18n.use(initReactI18next).init({
  resources: {
    ko: { common: ko },
    en: { common: en },
  },
  lng: navigator.language.startsWith('ko') ? 'ko' : 'en',
  fallbackLng: 'en',
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
})

export { i18n }
