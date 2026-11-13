import { Fragment, isValidElement, useCallback, useEffect, useMemo, useState } from 'react'
import { I18nContext } from './i18n'
import nl from './locales/nl'

const LANGUAGE_STORAGE_KEY = 'wilik-language'
// caches of the admin's instance-wide settings (AppSettings.default_language and
// public_language_button_enabled), so the first render on the next visit already matches
// them instead of flashing the browser language or popping the public button in late
const DEFAULT_LANGUAGE_STORAGE_KEY = 'wilik-language-default'
const PUBLIC_BUTTON_STORAGE_KEY = 'wilik-language-public-button'
const LANGUAGE_MENU_STORAGE_KEY = 'wilik-language-menu'
// keep in sync with LANGUAGE_OPTIONS in backend/helpers.py
const languages = {
  en: { name: 'English' },
  nl: { name: 'Nederlands' },
}
const translations = { en: {}, nl }

// first of the browser's preferred languages that we have, by base code (nl-BE -> nl)
function getBrowserLanguage() {
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0]
    if (languages[base]) return base
  }
  return 'en'
}

// 'default' (no stored choice) follows the instance default, which may itself be 'system'
function getInitialPreference() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return savedLanguage && languages[savedLanguage] ? savedLanguage : 'default'
}

function getInitialInstanceDefault() {
  const cached = localStorage.getItem(DEFAULT_LANGUAGE_STORAGE_KEY)
  return cached && languages[cached] ? cached : 'system'
}

export function I18nProvider({ children }) {
  const [languagePreference, setLanguagePreferenceState] = useState(getInitialPreference)
  const [instanceDefault, setInstanceDefault] = useState(getInitialInstanceDefault)
  const [publicLanguageButtonEnabled, setPublicLanguageButtonEnabled] = useState(
    () => localStorage.getItem(PUBLIC_BUTTON_STORAGE_KEY) === 'true',
  )
  // off by default: the navbar language button is opt-in from Settings
  const [showLanguageMenu, setShowLanguageMenuState] = useState(
    () => localStorage.getItem(LANGUAGE_MENU_STORAGE_KEY) === 'true',
  )
  // unsaved choices from the Settings form: shown live as a preview, stored only on Save
  // (null = no preview, use the saved value)
  const [previewPreference, setPreviewPreference] = useState(null)
  const [previewShowLanguageMenu, setPreviewShowLanguageMenu] = useState(null)

  const defaultLanguage = instanceDefault === 'system' ? getBrowserLanguage() : instanceDefault
  const activePreference = previewPreference ?? languagePreference
  const language = activePreference === 'default' ? defaultLanguage : activePreference
  const languageMenuVisible = previewShowLanguageMenu ?? showLanguageMenu

  const setLanguagePreference = useCallback((nextPreference) => {
    if (nextPreference === 'default') {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY)
    } else if (languages[nextPreference]) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextPreference)
    } else {
      return
    }
    setLanguagePreferenceState(nextPreference)
    setPreviewPreference(null)
  }, [])

  const setShowLanguageMenu = useCallback((show) => {
    if (show) {
      localStorage.setItem(LANGUAGE_MENU_STORAGE_KEY, 'true')
    } else {
      localStorage.removeItem(LANGUAGE_MENU_STORAGE_KEY)
    }
    setShowLanguageMenuState(show)
    setPreviewShowLanguageMenu(null)
  }, [])

  // drops any unsaved preview, e.g. when leaving Settings without saving
  const clearLanguagePreview = useCallback(() => {
    setPreviewPreference(null)
    setPreviewShowLanguageMenu(null)
  }, [])

  // called with the /api/settings response on app load and after an admin saves
  const applyInstanceSettings = useCallback((settings) => {
    const nextDefault = languages[settings.default_language] ? settings.default_language : 'system'
    if (nextDefault === 'system') {
      localStorage.removeItem(DEFAULT_LANGUAGE_STORAGE_KEY)
    } else {
      localStorage.setItem(DEFAULT_LANGUAGE_STORAGE_KEY, nextDefault)
    }
    const publicButton = Boolean(settings.public_language_button_enabled)
    if (publicButton) {
      localStorage.setItem(PUBLIC_BUTTON_STORAGE_KEY, 'true')
    } else {
      localStorage.removeItem(PUBLIC_BUTTON_STORAGE_KEY)
    }
    setInstanceDefault(nextDefault)
    setPublicLanguageButtonEnabled(publicButton)
  }, [])

  const value = useMemo(() => {
    // values may be React elements (e.g. a <strong> name), so a whole sentence stays one
    // translatable string instead of being cut into fragments around the markup; in that
    // case t() returns an array of nodes instead of a plain string
    function t(key, values = {}) {
      // backend error messages are passed through t() too, and may be missing
      if (typeof key !== 'string') return key
      const message = translations[language][key] ?? key
      const hasElement = Object.values(values).some(isValidElement)
      if (!hasElement) {
        return message.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`))
      }
      return message.split(/(\{\w+\})/).map((part, index) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1]
        if (!name) return part
        const value = values[name]
        return isValidElement(value) ? <Fragment key={index}>{value}</Fragment> : String(value ?? part)
      })
    }

    // the options of every personal language picker (Settings and the navbar modal); the
    // first one means "no own choice" and follows the instance default
    const languageOptions = [
      {
        value: 'default',
        label:
          instanceDefault === 'system'
            ? t('Match browser language')
            : t('Default ({language})', { language: languages[instanceDefault].name }),
      },
      ...Object.entries(languages).map(([code, details]) => ({ value: code, label: details.name })),
    ]

    return {
      language,
      languages,
      languageOptions,
      // what's in effect right now: the Settings preview if there is one, else the saved value
      activePreference,
      languageMenuVisible,
      // saving (also clears the preview)
      setLanguagePreference,
      setShowLanguageMenu,
      // live preview while editing Settings
      setPreviewPreference,
      setPreviewShowLanguageMenu,
      clearLanguagePreview,
      publicLanguageButtonEnabled,
      applyInstanceSettings,
      t,
    }
  }, [
    language,
    instanceDefault,
    activePreference,
    languageMenuVisible,
    publicLanguageButtonEnabled,
    setLanguagePreference,
    setShowLanguageMenu,
    clearLanguagePreview,
    applyInstanceSettings,
  ])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
