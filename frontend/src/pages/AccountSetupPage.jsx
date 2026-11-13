import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { SpinnerIcon } from '../components/Icons'
import LanguageSelect from '../components/LanguageSelect'
import { useI18n } from '../i18n'

const API_BASE = '/api'

function AccountSetupPage({ appName }) {
  const { t } = useI18n()
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading' | 'invalid' | 'ready'
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/account/setup/${token}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setNewUsername(data.username)
        setStatus('ready')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError(t("New passwords don't match"))
      return
    }
    setBusy(true)
    fetch(`${API_BASE}/account/setup/${token}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        new_username: newUsername,
        new_password: newPassword,
      }),
    }).then((response) => {
      if (!response.ok) {
        setBusy(false)
        response.json().then((data) => setError(data.error))
        return
      }
      navigate('/', { replace: true })
    })
  }

  if (status === 'loading') return null

  return (
    <div className="login-page">
      <LanguageSelect />
      {status === 'invalid' ? (
        <div className="gift-form login-form">
          <div className="login-form__brand">
            <Logo size={40} />
            <h1>{appName}</h1>
          </div>
          <p className="login-form__hint">{t('This setup link is invalid or has expired. Ask your admin for a new one.')}</p>
        </div>
      ) : (
        <form className="gift-form login-form" onSubmit={handleSubmit}>
          <div className="login-form__brand">
            <Logo size={40} />
            <h1>{appName}</h1>
          </div>
          <p className="login-form__hint">{t('Choose your username and set a password to finish setting up your account')}</p>
          <label>
            {t('Username')}
            <input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} required autoFocus />
          </label>
          <label>
            {t('New password')}
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <label>
            {t('Confirm new password')}
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? (
              <>
                <SpinnerIcon /> {t('Saving…')}
              </>
            ) : (
              t('Save and continue')
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default AccountSetupPage
