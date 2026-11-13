import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './components/Login'
import FirstLoginSetup from './components/FirstLoginSetup'
import Logo from './components/Logo'
import { SettingsIcon, KeyIcon, LogoutIcon, UserIcon, ArchiveIcon, MenuIcon, CloseIcon, GiftIcon } from './components/Icons'
import WishlistPage from './pages/WishlistPage'
import ReceivedPage from './pages/ReceivedPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import PublicWishlistPage from './pages/PublicWishlistPage'
import AccountSetupPage from './pages/AccountSetupPage'
import GiftDirectoryPage from './pages/GiftDirectoryPage'
import WishlistChooserPage from './pages/WishlistChooserPage'
import WishlistBrowsePage from './pages/WishlistBrowsePage'
import { themeStyle } from './themePresets'
import { cacheDefaultColorScheme } from './colorScheme'
import LanguageSelect from './components/LanguageSelect'
import { useI18n } from './i18n'
import './App.css'

const API_BASE = '/api'

function AuthenticatedApp({ appName, onAppNameChange }) {
  const { t } = useI18n()
  const [currentUser, setCurrentUser] = useState(undefined) // undefined = still checking, null = logged out
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then(setCurrentUser)
  }, [])

  function handleLogout() {
    fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' }).then(() => {
      setCurrentUser(null)
    })
  }

  // an admin can reset a still-logged-in user's password out from under them; unless that
  // account is opted into the passwordless flow (handled in-session below via
  // FirstLoginSetup), it no longer has any password to re-authenticate with, so the only
  // way back in is the fresh setup link the admin was just given -- log them out to get there
  useEffect(() => {
    if (currentUser && currentUser.must_change_password && !currentUser.allow_passwordless_setup) {
      handleLogout()
    }
  }, [currentUser])

  if (currentUser === undefined) return null
  if (currentUser === null) return <Login appName={appName} onLogin={setCurrentUser} />
  if (currentUser.must_change_password && currentUser.allow_passwordless_setup) {
    return <FirstLoginSetup appName={appName} currentUser={currentUser} onUpdate={setCurrentUser} />
  }
  if (currentUser.must_change_password) {
    return <Login appName={appName} onLogin={setCurrentUser} />
  }

  return (
    <div className="app" style={themeStyle(currentUser.theme_color)}>
      <nav className="topbar">
        <div className="topbar__left">
          <Link to="/" className="topbar__brand">
            <Logo size={64} />
            <span>{appName}</span>
          </Link>
          <span className="topbar__user">
            <UserIcon />
            <span className="topbar__user-name">{currentUser.username}</span>
          </span>
        </div>
        <button
          type="button"
          className="topbar__menu-toggle"
          aria-label={menuOpen ? t('Close menu') : t('Open menu')}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <div className={menuOpen ? 'topbar__actions topbar__actions--open' : 'topbar__actions'}>
          <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
            <GiftIcon /> {t('Wishlists')}
          </Link>
          <Link to="/received" onClick={() => setMenuOpen(false)}>
            <ArchiveIcon /> {t('Received')}
          </Link>
          <Link to="/settings" onClick={() => setMenuOpen(false)}>
            <SettingsIcon /> {t('Settings')}
          </Link>
          {currentUser.is_admin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)}>
              <KeyIcon /> {t('Admin')}
            </Link>
          )}
          <LanguageSelect />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              handleLogout()
            }}
          >
            <LogoutIcon /> {t('Log out')}
          </button>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<WishlistPage currentUser={currentUser} />} />
        <Route path="/wishlist" element={<WishlistChooserPage />} />
        <Route path="/wishlist/browse" element={<WishlistBrowsePage />} />
        <Route path="/received" element={<ReceivedPage currentUser={currentUser} />} />
        <Route path="/settings" element={<SettingsPage currentUser={currentUser} onUpdate={setCurrentUser} />} />
        <Route
          path="/admin"
          element={
            currentUser.is_admin ? (
              <AdminPage currentUser={currentUser} appName={appName} onAppNameChange={onAppNameChange} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </div>
  )
}

function App() {
  const [appName, setAppName] = useState('Wilik')

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((response) => response.json())
      .then((data) => {
        setAppName(data.app_name)
        cacheDefaultColorScheme(data.default_color_scheme)
      })
  }, [])

  useEffect(() => {
    document.title = appName
  }, [appName])

  return (
    <Routes>
      <Route path="/list/:token" element={<PublicWishlistPage appName={appName} />} />
      <Route path="/directory" element={<GiftDirectoryPage appName={appName} />} />
      <Route path="/setup/:token" element={<AccountSetupPage appName={appName} />} />
      <Route path="/*" element={<AuthenticatedApp appName={appName} onAppNameChange={setAppName} />} />
    </Routes>
  )
}

export default App
