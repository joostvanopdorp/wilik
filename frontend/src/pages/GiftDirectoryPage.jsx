import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import GiftDirectoryList from '../components/GiftDirectoryList'
import { useI18n } from '../i18n'
import LanguageMenu from '../components/LanguageMenu'

function GiftDirectoryPage({ appName }) {
  const { t, publicLanguageButtonEnabled, languageMenuVisible } = useI18n()
  // the admin can show it to every visitor; anyone who turned on their own navbar button gets it too
  const showLanguageButton = publicLanguageButtonEnabled || languageMenuVisible
  return (
    <div className="app">
      <nav className="topbar">
        <div className="topbar__left">
          <Link to="/" className="topbar__brand">
            <Logo size={64} />
            <span>{appName}</span>
          </Link>
        </div>
        {showLanguageButton && (
          <div className="topbar__actions topbar__actions--static">
            <LanguageMenu />
          </div>
        )}
      </nav>
      <main>
        <div className="page">
          <h2>{t('Wishlists')}</h2>
          <GiftDirectoryList />
        </div>
      </main>
    </div>
  )
}

export default GiftDirectoryPage
