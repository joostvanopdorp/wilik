import { useState } from 'react'
import { createPortal } from 'react-dom'
import Modal from './Modal'
import { CheckIcon, GlobeIcon } from './Icons'
import { useI18n } from '../i18n'

// navbar button + language picker modal; rendered in the app navbar when the user opted in
// from Settings, and on the public pages when the admin turned it on
function LanguageMenu({ onOpen }) {
  const { language, languages, languageOptions, activePreference, setLanguagePreference, t } = useI18n()
  // where the open modal is rendered (see below); null = closed
  const [portalTarget, setPortalTarget] = useState(null)

  function choose(value) {
    setLanguagePreference(value)
    setPortalTarget(null)
  }

  // The modal must not live inside the navbar: on mobile the collapsed menu (display:none)
  // would hide it, and the navbar's button styles would leak into it. It still goes inside
  // .app rather than <body>, so the wishlist's theme color (set on .app) applies.
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          onOpen?.()
          setPortalTarget(event.currentTarget.closest('.app') ?? document.body)
        }}
      >
        <GlobeIcon /> {languages[language].name}
      </button>
      {portalTarget &&
        createPortal(
          <Modal open onClose={() => setPortalTarget(null)} titleId="language-modal-title" className="language-modal">
            <h3 id="language-modal-title">{t('Language')}</h3>
            <div className="language-modal__options">
              {languageOptions.map((option) => {
                const active = option.value === activePreference
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      active ? 'language-modal__option language-modal__option--active' : 'language-modal__option'
                    }
                    aria-pressed={active}
                    onClick={() => choose(option.value)}
                  >
                    <span>{option.label}</span>
                    {active && <CheckIcon />}
                  </button>
                )
              })}
            </div>
          </Modal>,
          portalTarget,
        )}
    </>
  )
}

// top-right corner of the login and account setup pages, which have no navbar; shown when
// the admin enabled the visitor language button, or this browser opted into its own
export function LoginPageLanguageMenu() {
  const { publicLanguageButtonEnabled, languageMenuVisible } = useI18n()
  if (!publicLanguageButtonEnabled && !languageMenuVisible) return null
  return (
    <div className="login-page__language">
      <LanguageMenu />
    </div>
  )
}

export default LanguageMenu
