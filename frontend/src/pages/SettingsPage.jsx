import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { THEME_PRESETS } from '../themePresets'
import { getColorScheme, setColorScheme } from '../colorScheme'
import { CURRENCY_OPTIONS, DECIMAL_SEPARATOR_OPTIONS } from '../formOptions'
import { CheckIcon, InfoIcon } from '../components/Icons'

const API_BASE = '/api'

function SettingsPage({ currentUser, onUpdate }) {
  const [shareCopied, setShareCopied] = useState(false)
  const [shareRegenerating, setShareRegenerating] = useState(false)
  const [showInDirectory, setShowInDirectory] = useState(currentUser.show_in_directory)
  const [colorScheme, setColorSchemeState] = useState(getColorScheme)
  const [themeSaved, setThemeSaved] = useState(false)
  const [claimManagementSiteEnabled, setClaimManagementSiteEnabled] = useState(false)
  const shareUrl = `${window.location.origin}/list/${currentUser.share_token}`

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((response) => response.json())
      .then((data) => setClaimManagementSiteEnabled(data.claim_management_site_enabled))
  }, [])

  function handleColorSchemeChange(event) {
    const value = event.target.value
    setColorSchemeState(value)
    setColorScheme(value)
  }

  function handleThemeSubmit(event) {
    event.preventDefault()
    setThemeSaved(true)
    setTimeout(() => setThemeSaved(false), 2000)
  }

  function handleCopyShareUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  function handleRegenerateShareUrl() {
    if (!confirm("Generate a new link? Your old share link will stop working.")) return
    setShareRegenerating(true)
    fetch(`${API_BASE}/account/share-token`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((updatedUser) => {
        onUpdate(updatedUser)
        setShareRegenerating(false)
      })
  }

  function handleShowInDirectoryChange(event) {
    const checked = event.target.checked
    setShowInDirectory(checked)
    fetch(`${API_BASE}/account`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ show_in_directory: checked }),
    })
      .then((response) => response.json())
      .then(onUpdate)
  }

  const [username, setUsername] = useState(currentUser.username)
  const [usernameError, setUsernameError] = useState(null)
  const [usernameSaved, setUsernameSaved] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const [listName, setListName] = useState(currentUser.list_name)
  const [currency, setCurrency] = useState(currentUser.currency)
  const [decimalSeparator, setDecimalSeparator] = useState(currentUser.decimal_separator)
  const [themeColor, setThemeColor] = useState(currentUser.theme_color)
  const [showImagePlaceholder, setShowImagePlaceholder] = useState(currentUser.show_image_placeholder)
  const [showBackgroundPattern, setShowBackgroundPattern] = useState(currentUser.show_background_pattern)
  const [guestSortByPrice, setGuestSortByPrice] = useState(currentUser.guest_sort_by_price_enabled)
  const [guestFilterByLabel, setGuestFilterByLabel] = useState(currentUser.guest_filter_by_label_enabled)
  const [guestFilterByBrand, setGuestFilterByBrand] = useState(currentUser.guest_filter_by_brand_enabled)
  const [claimManagementEnabled, setClaimManagementEnabled] = useState(currentUser.claim_management_enabled)
  const [lockIconClaimedOnly, setLockIconClaimedOnly] = useState(currentUser.lock_icon_claimed_only)
  const [generalError, setGeneralError] = useState(null)
  const [generalSaved, setGeneralSaved] = useState(false)
  const [appearanceError, setAppearanceError] = useState(null)
  const [appearanceSaved, setAppearanceSaved] = useState(false)
  const [guestSettingsError, setGuestSettingsError] = useState(null)
  const [guestSettingsSaved, setGuestSettingsSaved] = useState(false)
  const [claimManagementError, setClaimManagementError] = useState(null)
  const [claimManagementSaved, setClaimManagementSaved] = useState(false)

  function handleUsernameSubmit(event) {
    event.preventDefault()
    setUsernameError(null)
    setUsernameSaved(false)
    fetch(`${API_BASE}/account`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setUsernameError(data.error))
        return
      }
      response.json().then((updatedUser) => {
        onUpdate(updatedUser)
        setUsernameSaved(true)
        setTimeout(() => setUsernameSaved(false), 2000)
      })
    })
  }

  function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match")
      return
    }
    fetch(`${API_BASE}/account/password`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: newPassword }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setPasswordError(data.error))
        return
      }
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 2000)
    })
  }

  function handleGeneralSubmit(event) {
    event.preventDefault()
    setGeneralError(null)
    setGeneralSaved(false)
    fetch(`${API_BASE}/account`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        list_name: listName,
        currency,
        decimal_separator: decimalSeparator,
      }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setGeneralError(data.error))
        return
      }
      response.json().then((updatedUser) => {
        onUpdate(updatedUser)
        setGeneralSaved(true)
        setTimeout(() => setGeneralSaved(false), 2000)
      })
    })
  }

  function handleAppearanceSubmit(event) {
    event.preventDefault()
    setAppearanceError(null)
    setAppearanceSaved(false)
    fetch(`${API_BASE}/account`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme_color: themeColor,
        show_image_placeholder: showImagePlaceholder,
        show_background_pattern: showBackgroundPattern,
      }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setAppearanceError(data.error))
        return
      }
      response.json().then((updatedUser) => {
        onUpdate(updatedUser)
        setAppearanceSaved(true)
        setTimeout(() => setAppearanceSaved(false), 2000)
      })
    })
  }

  function handleGuestSettingsSubmit(event) {
    event.preventDefault()
    setGuestSettingsError(null)
    setGuestSettingsSaved(false)
    fetch(`${API_BASE}/account`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_sort_by_price_enabled: guestSortByPrice,
        guest_filter_by_label_enabled: guestFilterByLabel,
        guest_filter_by_brand_enabled: guestFilterByBrand,
      }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setGuestSettingsError(data.error))
        return
      }
      response.json().then((updatedUser) => {
        onUpdate(updatedUser)
        setGuestSettingsSaved(true)
        setTimeout(() => setGuestSettingsSaved(false), 2000)
      })
    })
  }

  function handleClaimManagementSubmit(event) {
    event.preventDefault()
    setClaimManagementError(null)
    setClaimManagementSaved(false)
    fetch(`${API_BASE}/account`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claim_management_enabled: claimManagementEnabled,
        lock_icon_claimed_only: lockIconClaimedOnly,
      }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setClaimManagementError(data.error))
        return
      }
      response.json().then((updatedUser) => {
        onUpdate(updatedUser)
        setClaimManagementSaved(true)
        setTimeout(() => setClaimManagementSaved(false), 2000)
      })
    })
  }

  return (
    <div className="page">
      <Link className="page__back" to="/">
        ← Back to wishlist
      </Link>
      <h2>Settings</h2>

      <h3>Share your wishlist</h3>
      <div className="card">
        <p className="info-block" style={{ marginTop: 0, marginBottom: 10 }}>
          <InfoIcon />
          Anyone with this link can view your list and claim items.
        </p>
        <div className="inline-field">
          <input className="share-link__input" value={shareUrl} readOnly onFocus={(event) => event.target.select()} />
          <button type="button" className="btn-primary" onClick={handleCopyShareUrl}>
            {shareCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="gift-form__actions">
          <button type="button" className="btn-primary" onClick={handleRegenerateShareUrl} disabled={shareRegenerating}>
            Generate new link
          </button>
        </div>
        <label className="user-admin__checkbox" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={showInDirectory} onChange={handleShowInDirectoryChange} />
          List my wishlist in the browsable directory
        </label>
      </div>

      <h3>Wishlist settings</h3>

      <form className="gift-form" onSubmit={handleGeneralSubmit}>
        <h3 className="gift-form__badge">General</h3>
        <label>
          List name
          <input value={listName} onChange={(event) => setListName(event.target.value)} required />
        </label>
        <div className="gift-form__row">
          <label>
            Currency
            <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Decimals
            <select value={decimalSeparator} onChange={(event) => setDecimalSeparator(event.target.value)}>
              {DECIMAL_SEPARATOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {generalError && <p className="form-error">{generalError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {generalSaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Saved
            </p>
          )}
        </div>
      </form>

      <form className="gift-form" onSubmit={handleAppearanceSubmit}>
        <h3 className="gift-form__badge">Appearance</h3>
        <label>
          Theme color
          <span className="theme-swatches">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className={preset.value === themeColor ? 'theme-swatch theme-swatch--selected' : 'theme-swatch'}
                style={{ backgroundColor: preset.swatchColor }}
                title={preset.name}
                aria-label={preset.name}
                onClick={() => setThemeColor(preset.value)}
              />
            ))}
          </span>
        </label>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={showImagePlaceholder}
            onChange={(event) => setShowImagePlaceholder(event.target.checked)}
          />
          Show a placeholder image for items without a photo
        </label>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={showBackgroundPattern}
            onChange={(event) => setShowBackgroundPattern(event.target.checked)}
          />
          Show a subtle background pattern on gift cards
        </label>
        {appearanceError && <p className="form-error">{appearanceError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {appearanceSaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Saved
            </p>
          )}
        </div>
      </form>

      <form className="gift-form" onSubmit={handleGuestSettingsSubmit}>
        <h3 className="gift-form__badge">Guest sorting &amp; filtering</h3>
        <p className="info-block">
          <InfoIcon />
          Lets guests browsing your list narrow it down themselves. This is handy for longer lists.
        </p>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={guestSortByPrice}
            onChange={(event) => setGuestSortByPrice(event.target.checked)}
          />
          Let guests also sort by price
        </label>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={guestFilterByLabel}
            onChange={(event) => setGuestFilterByLabel(event.target.checked)}
          />
          Let guests filter by label
        </label>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={guestFilterByBrand}
            onChange={(event) => setGuestFilterByBrand(event.target.checked)}
          />
          Let guests filter by brand
        </label>
        {guestSettingsError && <p className="form-error">{guestSettingsError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {guestSettingsSaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Saved
            </p>
          )}
        </div>
      </form>

      {claimManagementSiteEnabled && (
        <form className="gift-form" onSubmit={handleClaimManagementSubmit}>
          <h3 className="gift-form__badge">Claim management</h3>
          <p className="info-block">
            <InfoIcon />
            <span>
              <strong>Caution!</strong> Claims normally stay hidden and anonymous to preserve the surprise. This lets
              you deliberately reveal or reset them.
            </span>
          </p>
          <label className="user-admin__checkbox">
            <input
              type="checkbox"
              checked={claimManagementEnabled}
              onChange={(event) => setClaimManagementEnabled(event.target.checked)}
            />
            Let me reveal and manage claims on this wishlist
          </label>
          {claimManagementEnabled && (
            <label className="user-admin__checkbox">
              <input
                type="checkbox"
                checked={lockIconClaimedOnly}
                onChange={(event) => setLockIconClaimedOnly(event.target.checked)}
              />
              <span>
                Only show the lock icon on already-claimed items{' '}
                <span className="not-recommended">(not recommended)</span>
              </span>
            </label>
          )}
          {claimManagementError && <p className="form-error">{claimManagementError}</p>}
          <div className="gift-form__actions">
            <button type="submit">Save</button>
            {claimManagementSaved && (
              <p className="form-success">
                <span className="form-success__icon">
                  <CheckIcon />
                </span>
                Saved
              </p>
            )}
          </div>
        </form>
      )}

      <h3>Account settings</h3>

      <form className="gift-form" onSubmit={handleUsernameSubmit}>
        <h3 className="gift-form__badge">Change username</h3>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        {usernameError && <p className="form-error">{usernameError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {usernameSaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Saved
            </p>
          )}
        </div>
      </form>

      <form className="gift-form" onSubmit={handlePasswordSubmit}>
        <h3 className="gift-form__badge">Change password</h3>
        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        {passwordError && <p className="form-error">{passwordError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {passwordSaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Password changed
            </p>
          )}
        </div>
      </form>

      <h3>App theme</h3>
      <form className="gift-form" onSubmit={handleThemeSubmit}>
        <p className="info-block" style={{ marginTop: 0, marginBottom: 4 }}>
          <InfoIcon />
          Only changes how the app looks for you. Wishlist visitors aren't affected.
        </p>
        <select value={colorScheme} onChange={handleColorSchemeChange} aria-label="App theme">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto">Match system</option>
        </select>
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {themeSaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Saved
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

export default SettingsPage
