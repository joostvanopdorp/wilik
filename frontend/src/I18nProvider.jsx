import { useEffect, useMemo, useState } from 'react'
import { I18nContext } from './i18n'
import nl from './locales/nl'

const LANGUAGE_STORAGE_KEY = 'wilik-language'
const languages = {
  en: { name: 'English' },
  nl: { name: 'Nederlands' },
}
const translations = { en: {}, nl }

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (savedLanguage && languages[savedLanguage]) return savedLanguage

  return navigator.language.toLowerCase().startsWith('nl') ? 'nl' : 'en'
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  function setLanguage(nextLanguage) {
    if (!languages[nextLanguage]) return
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    setLanguageState(nextLanguage)
  }

  const value = useMemo(() => {
    function t(key, values = {}) {
      const message = translations[language][key] ?? key
      return message.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`))
    }

    return { language, languages, setLanguage, t }
  }, [language])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
