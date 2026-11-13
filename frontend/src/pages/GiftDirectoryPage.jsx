import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import GiftDirectoryList from '../components/GiftDirectoryList'
import { useI18n } from '../i18n'
import LanguageSelect from '../components/LanguageSelect'

function GiftDirectoryPage({ appName }) {
  const { t } = useI18n()
  return (
    <div className="app">
      <nav className="topbar">
        <div className="topbar__left">
          <Link to="/" className="topbar__brand">
            <Logo size={64} />
            <span>{appName}</span>
          </Link>
        </div>
        <div className="topbar__actions">
          <LanguageSelect />
        </div>
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
