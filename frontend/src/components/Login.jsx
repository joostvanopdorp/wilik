import { useState } from 'react'
import Logo from './Logo'
import GiftDirectory from './GiftDirectory'
import { SpinnerIcon } from './Icons'

function Login({ appName, onLogin }) {
  const [step, setStep] = useState('username')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function handleUsernameSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    fetch('/api/login/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).then((response) => {
      if (!response.ok) {
        setBusy(false)
        setError('User not found')
        return
      }
      response.json().then((data) => {
        if (data.needs_password_setup) {
          if (data.passwordless_allowed) {
            // admin explicitly opted this account into skipping the setup link --
            // log straight in, the forced setup screen takes it from here
            logIn('')
            return
          }
          setBusy(false)
          setStep('needs-setup')
          return
        }
        setBusy(false)
        setStep('password')
      })
    })
  }

  function handleLoginSubmit(event) {
    event.preventDefault()
    setBusy(true)
    logIn(password)
  }

  function logIn(passwordValue) {
    setError(null)
    fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordValue, remember: rememberMe }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => {
          setBusy(false)
          setError(data.error || 'Invalid username or password')
        })
        return
      }
      response.json().then(onLogin)
    })
  }

  function handleBack() {
    setStep('username')
    setPassword('')
    setError(null)
  }

  return (
    <div className="login-page">
      <GiftDirectory />
      {step === 'needs-setup' ? (
        <form className="gift-form login-form" onSubmit={(event) => event.preventDefault()}>
          <div className="login-form__brand">
            <Logo size={40} />
            <h1>{appName}</h1>
          </div>
          <p className="login-form__hint">
            <strong>{username}</strong>'s account isn't set up yet. Ask your admin for your setup link.
          </p>
          <button type="button" className="login-form__back" onClick={handleBack}>
            Go back
          </button>
        </form>
      ) : step === 'username' ? (
        <form className="gift-form login-form" onSubmit={handleUsernameSubmit}>
          <div className="login-form__brand">
            <Logo size={40} />
            <h1>{appName}</h1>
          </div>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} required autoFocus />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? (
              <>
                <SpinnerIcon /> Checking…
              </>
            ) : (
              'Next'
            )}
          </button>
        </form>
      ) : (
        <form className="gift-form login-form" onSubmit={handleLoginSubmit}>
          <div className="login-form__brand">
            <Logo size={40} />
            <h1>{appName}</h1>
          </div>
          <p className="login-form__hint">
            Continuing as <strong>{username}</strong>
          </p>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoFocus
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? (
              <>
                <SpinnerIcon /> Logging in…
              </>
            ) : (
              'Log in'
            )}
          </button>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Stay logged in
          </label>
          <button type="button" className="login-form__back" onClick={handleBack} disabled={busy}>
            Not you? Go back
          </button>
        </form>
      )}
    </div>
  )
}

export default Login
