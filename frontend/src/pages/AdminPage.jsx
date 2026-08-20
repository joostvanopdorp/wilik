import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PencilIcon, TrashIcon, SpinnerIcon, CheckIcon, CloseIcon, InfoIcon } from '../components/Icons'
import { THEME_PRESETS } from '../themePresets'
import { CURRENCY_OPTIONS, DECIMAL_SEPARATOR_OPTIONS } from '../formOptions'

const API_BASE = '/api'

function AdminPage({ currentUser, appName, onAppNameChange }) {
  const [users, setUsers] = useState([])
  const [appNameInput, setAppNameInput] = useState(appName)
  const [appNameError, setAppNameError] = useState(null)
  const [appNameSaved, setAppNameSaved] = useState(false)
  const [username, setUsername] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwordless, setPasswordless] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [userError, setUserError] = useState(null)
  const [resetNotice, setResetNotice] = useState(null)
  const [resetSetupLink, setResetSetupLink] = useState(null)
  const [resetLinkCopied, setResetLinkCopied] = useState(false)
  const [createNotice, setCreateNotice] = useState(null)
  const [createSetupLink, setCreateSetupLink] = useState(null)
  const [createLinkCopied, setCreateLinkCopied] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const editInitialRef = useRef(null)
  const editModalRef = useRef(null)
  const editUsernameInputRef = useRef(null)
  // captured synchronously when the modal is triggered to open, so the focus-restore
  // on close is correct even when the modal switches straight to a different user
  // without unmounting
  const editTriggerRef = useRef(null)
  // kept in sync below so the Escape handler always sees the latest unsaved-edits
  // check, without re-running the focus-management effect on every keystroke
  const closeEditPanelRef = useRef(null)
  const [editUsername, setEditUsername] = useState('')
  const [editIsAdmin, setEditIsAdmin] = useState(false)
  const [editListName, setEditListName] = useState('')
  const [editShowInDirectory, setEditShowInDirectory] = useState(true)
  const [editThemeColor, setEditThemeColor] = useState(null)
  const [editCurrency, setEditCurrency] = useState('€')
  const [editDecimalSeparator, setEditDecimalSeparator] = useState(',')
  const [editShowImagePlaceholder, setEditShowImagePlaceholder] = useState(true)
  const [editShowBackgroundPattern, setEditShowBackgroundPattern] = useState(true)
  const [editGuestSortByPrice, setEditGuestSortByPrice] = useState(false)
  const [editGuestFilterByLabel, setEditGuestFilterByLabel] = useState(false)
  const [editGuestFilterByBrand, setEditGuestFilterByBrand] = useState(false)
  const [editClaimManagementEnabled, setEditClaimManagementEnabled] = useState(false)
  const [editLockIconClaimedOnly, setEditLockIconClaimedOnly] = useState(false)
  const [editResetPasswordless, setEditResetPasswordless] = useState(false)
  const [editUsernameError, setEditUsernameError] = useState(null)
  const [editUsernameSaved, setEditUsernameSaved] = useState(false)
  const [editAdminError, setEditAdminError] = useState(null)
  const [editAdminSaved, setEditAdminSaved] = useState(false)
  const [editGeneralError, setEditGeneralError] = useState(null)
  const [editGeneralSaved, setEditGeneralSaved] = useState(false)
  const [editAppearanceError, setEditAppearanceError] = useState(null)
  const [editAppearanceSaved, setEditAppearanceSaved] = useState(false)
  const [editGuestError, setEditGuestError] = useState(null)
  const [editGuestSaved, setEditGuestSaved] = useState(false)
  const [editClaimError, setEditClaimError] = useState(null)
  const [editClaimSaved, setEditClaimSaved] = useState(false)
  const [publicDirectoryEnabled, setPublicDirectoryEnabled] = useState(true)
  const [directoryError, setDirectoryError] = useState(null)
  const [directorySaved, setDirectorySaved] = useState(false)
  const [defaultColorScheme, setDefaultColorScheme] = useState('dark')
  const [defaultColorSchemeError, setDefaultColorSchemeError] = useState(null)
  const [defaultColorSchemeSaved, setDefaultColorSchemeSaved] = useState(false)
  const [claimManagementSiteEnabled, setClaimManagementSiteEnabled] = useState(false)
  const [claimDeleteWarningSkipped, setClaimDeleteWarningSkipped] = useState(false)
  const [claimManagementSiteError, setClaimManagementSiteError] = useState(null)
  const [claimManagementSiteSaved, setClaimManagementSiteSaved] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/users`, { credentials: 'include' })
      .then((response) => response.json())
      .then(setUsers)
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((response) => response.json())
      .then((data) => {
        setPublicDirectoryEnabled(data.public_directory_enabled)
        setDefaultColorScheme(data.default_color_scheme)
        setClaimManagementSiteEnabled(data.claim_management_site_enabled)
        setClaimDeleteWarningSkipped(data.claim_delete_warning_skipped)
      })
  }, [])

  useEffect(() => {
    closeEditPanelRef.current = closeEditPanel
  })

  useEffect(() => {
    if (editingUserId === null) return undefined
    const previouslyFocused = editTriggerRef.current
    if (editingUserId === currentUser.id) {
      editUsernameInputRef.current?.focus()
    } else {
      editModalRef.current?.focus()
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeEditPanelRef.current()
        return
      }
      if (event.key === 'Tab') {
        const focusable = editModalRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [editingUserId, currentUser.id])

  function handleAppNameSubmit(event) {
    event.preventDefault()
    setAppNameError(null)
    setAppNameSaved(false)
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_name: appNameInput }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setAppNameError(data.error))
        return
      }
      response.json().then((data) => {
        onAppNameChange(data.app_name)
        setAppNameSaved(true)
        setTimeout(() => setAppNameSaved(false), 2000)
      })
    })
  }

  function handleDirectorySubmit(event) {
    event.preventDefault()
    setDirectoryError(null)
    setDirectorySaved(false)
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_directory_enabled: publicDirectoryEnabled }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setDirectoryError(data.error))
        return
      }
      setDirectorySaved(true)
      setTimeout(() => setDirectorySaved(false), 2000)
    })
  }

  function handleClaimManagementSiteSubmit(event) {
    event.preventDefault()
    setClaimManagementSiteError(null)
    setClaimManagementSiteSaved(false)
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claim_management_site_enabled: claimManagementSiteEnabled,
        claim_delete_warning_skipped: claimDeleteWarningSkipped,
      }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setClaimManagementSiteError(data.error))
        return
      }
      setClaimManagementSiteSaved(true)
      setTimeout(() => setClaimManagementSiteSaved(false), 2000)
    })
  }

  function handleDefaultColorSchemeSubmit(event) {
    event.preventDefault()
    setDefaultColorSchemeError(null)
    setDefaultColorSchemeSaved(false)
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_color_scheme: defaultColorScheme }),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => setDefaultColorSchemeError(data.error))
        return
      }
      setDefaultColorSchemeSaved(true)
      setTimeout(() => setDefaultColorSchemeSaved(false), 2000)
    })
  }

  function handleCopyLink(url, setCopied) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleCreateUser(event) {
    event.preventDefault()
    setUserError(null)
    setCreatingUser(true)
    fetch(`${API_BASE}/users`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, is_admin: isAdmin, passwordless }),
    }).then((response) => {
      if (!response.ok) {
        setCreatingUser(false)
        response.json().then((data) => setUserError(data.error))
        return
      }
      response.json().then((newUser) => {
        setCreatingUser(false)
        setUsers((current) => [...current, newUser])
        setCreateSetupLink(
          newUser.setup_token
            ? { username: newUser.username, url: `${window.location.origin}/setup/${newUser.setup_token}` }
            : null
        )
        setCreateNotice(
          newUser.setup_token
            ? null
            : `${newUser.username} can log in immediately with just their username. They'll be asked to set a password.`
        )
        setUsername('')
        setIsAdmin(false)
        setPasswordless(false)
      })
    })
  }

  function handleDeleteUser(user) {
    if (!confirm(`Delete ${user.username}? Their wishlist will be deleted too.`)) return
    fetch(`${API_BASE}/users/${user.id}`, { method: 'DELETE', credentials: 'include' }).then(() => {
      setUsers((current) => current.filter((u) => u.id !== user.id))
    })
  }

  function handleResetPassword(user) {
    if (!confirm(`Reset ${user.username}'s password? They'll set a new one next time they log in.`)) return
    setResetNotice(null)
    setResetSetupLink(null)
    fetch(`${API_BASE}/users/${user.id}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passwordless: editResetPasswordless }),
    }).then((response) => {
      if (!response.ok) return
      response.json().then((updatedUser) => {
        setUsers((current) => current.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
        setResetSetupLink(
          updatedUser.setup_token
            ? { username: user.username, url: `${window.location.origin}/setup/${updatedUser.setup_token}` }
            : null
        )
        setResetNotice(
          updatedUser.setup_token
            ? null
            : `${user.username} can log in immediately with just their username. They'll be asked to set a new password.`
        )
      })
    })
  }

  function startEditUser(user) {
    setEditingUserId(user.id)
    setEditUsername(user.username)
    setEditIsAdmin(user.is_admin)
    setEditListName(user.list_name)
    setEditShowInDirectory(user.show_in_directory)
    setEditThemeColor(user.theme_color)
    setEditCurrency(user.currency)
    setEditDecimalSeparator(user.decimal_separator)
    setEditShowImagePlaceholder(user.show_image_placeholder)
    setEditShowBackgroundPattern(user.show_background_pattern)
    setEditGuestSortByPrice(user.guest_sort_by_price_enabled)
    setEditGuestFilterByLabel(user.guest_filter_by_label_enabled)
    setEditGuestFilterByBrand(user.guest_filter_by_brand_enabled)
    setEditClaimManagementEnabled(user.claim_management_enabled)
    setEditLockIconClaimedOnly(user.lock_icon_claimed_only)
    setEditResetPasswordless(false)
    setEditUsernameError(null)
    setEditUsernameSaved(false)
    setEditAdminError(null)
    setEditAdminSaved(false)
    setEditGeneralError(null)
    setEditGeneralSaved(false)
    setEditAppearanceError(null)
    setEditAppearanceSaved(false)
    setEditGuestError(null)
    setEditGuestSaved(false)
    setEditClaimError(null)
    setEditClaimSaved(false)
    setResetNotice(null)
    setResetSetupLink(null)
    editInitialRef.current = {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      list_name: user.list_name,
      show_in_directory: user.show_in_directory,
      theme_color: user.theme_color,
      currency: user.currency,
      decimal_separator: user.decimal_separator,
      show_image_placeholder: user.show_image_placeholder,
      show_background_pattern: user.show_background_pattern,
      guest_sort_by_price_enabled: user.guest_sort_by_price_enabled,
      guest_filter_by_label_enabled: user.guest_filter_by_label_enabled,
      guest_filter_by_brand_enabled: user.guest_filter_by_brand_enabled,
      claim_management_enabled: user.claim_management_enabled,
      lock_icon_claimed_only: user.lock_icon_claimed_only,
    }
  }

  function hasUnsavedEdits() {
    const initial = editInitialRef.current
    if (!initial) return false
    return (
      editUsername !== initial.username ||
      editIsAdmin !== initial.is_admin ||
      editListName !== initial.list_name ||
      editShowInDirectory !== initial.show_in_directory ||
      editThemeColor !== initial.theme_color ||
      editCurrency !== initial.currency ||
      editDecimalSeparator !== initial.decimal_separator ||
      editShowImagePlaceholder !== initial.show_image_placeholder ||
      editShowBackgroundPattern !== initial.show_background_pattern ||
      editGuestSortByPrice !== initial.guest_sort_by_price_enabled ||
      editGuestFilterByLabel !== initial.guest_filter_by_label_enabled ||
      editGuestFilterByBrand !== initial.guest_filter_by_brand_enabled ||
      editClaimManagementEnabled !== initial.claim_management_enabled ||
      editLockIconClaimedOnly !== initial.lock_icon_claimed_only
    )
  }

  function closeEditPanel() {
    if (hasUnsavedEdits() && !confirm('Discard unsaved changes?')) return
    editInitialRef.current = null
    setEditingUserId(null)
  }

  function requestEditUser(user) {
    if (editingUserId === user.id) {
      closeEditPanel()
      return
    }
    if (hasUnsavedEdits() && !confirm('Discard unsaved changes?')) return
    editTriggerRef.current = document.activeElement
    startEditUser(user)
  }

  function saveUserFields(user, fields, setError, setSaved) {
    setError(null)
    setSaved(false)
    fetch(`${API_BASE}/users/${user.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    }).then((response) => {
      if (!response.ok) {
        response.json().then((data) => {
          if (editInitialRef.current?.id === user.id) setError(data.error)
        })
        return
      }
      response.json().then((updatedUser) => {
        setUsers((current) => current.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
        if (editInitialRef.current?.id === user.id) {
          editInitialRef.current = {
            ...editInitialRef.current,
            ...Object.fromEntries(Object.keys(fields).map((key) => [key, updatedUser[key]])),
          }
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        }
      })
    })
  }

  function handleUsernameSubmit(event, user) {
    event.preventDefault()
    saveUserFields(user, { username: editUsername }, setEditUsernameError, setEditUsernameSaved)
  }

  function handleAdminSubmit(event, user) {
    event.preventDefault()
    saveUserFields(user, { is_admin: editIsAdmin }, setEditAdminError, setEditAdminSaved)
  }

  function handleGeneralSubmit(event, user) {
    event.preventDefault()
    saveUserFields(
      user,
      {
        list_name: editListName,
        currency: editCurrency,
        decimal_separator: editDecimalSeparator,
        show_in_directory: editShowInDirectory,
      },
      setEditGeneralError,
      setEditGeneralSaved
    )
  }

  function handleAppearanceSubmit(event, user) {
    event.preventDefault()
    saveUserFields(
      user,
      {
        theme_color: editThemeColor,
        show_image_placeholder: editShowImagePlaceholder,
        show_background_pattern: editShowBackgroundPattern,
      },
      setEditAppearanceError,
      setEditAppearanceSaved
    )
  }

  function handleGuestSubmit(event, user) {
    event.preventDefault()
    saveUserFields(
      user,
      {
        guest_sort_by_price_enabled: editGuestSortByPrice,
        guest_filter_by_label_enabled: editGuestFilterByLabel,
        guest_filter_by_brand_enabled: editGuestFilterByBrand,
      },
      setEditGuestError,
      setEditGuestSaved
    )
  }

  function handleClaimSubmit(event, user) {
    event.preventDefault()
    saveUserFields(
      user,
      {
        claim_management_enabled: editClaimManagementEnabled,
        lock_icon_claimed_only: editLockIconClaimedOnly,
      },
      setEditClaimError,
      setEditClaimSaved
    )
  }

  const editingUser = users.find((u) => u.id === editingUserId) ?? null

  return (
    <div className="page">
      <Link className="page__back" to="/">
        ← Back to wishlist
      </Link>
      <h2>Admin panel</h2>

      <h3>User management</h3>
      <div className="card">
        <ul className="user-admin__list">
          {users.map((user) => (
            <li key={user.id}>
              <div className="user-admin__row">
                <span>
                  {user.username}
                  {user.is_admin && <span className="not-recommended"> (admin)</span>}
                  {user.must_change_password ? ' (setup pending)' : ''}
                </span>
                <span className="user-admin__row-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Edit user"
                    title="Edit user"
                    onClick={() => requestEditUser(user)}
                  >
                    <PencilIcon />
                  </button>
                  {user.id !== currentUser.id && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Delete user"
                      title="Delete user"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editingUser && (
        <div className="user-edit-modal__backdrop" role="presentation" onClick={() => closeEditPanel()}>
          <section
            ref={editModalRef}
            className="user-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-edit-modal-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button user-edit-modal__close"
              aria-label="Close"
              onClick={() => closeEditPanel()}
            >
              <CloseIcon />
            </button>
            <h3 id="user-edit-modal-title" className="user-edit-modal__title">
              Manage user: {editingUser.username}
            </h3>
            <div className="user-admin__edit-panel">
              <h3 className="user-edit-modal__group">Account settings</h3>

              {editingUser.id !== currentUser.id && (
                <div className="gift-form">
                  <h3 className="gift-form__badge">Reset password</h3>
                  <label className="user-admin__checkbox">
                    <input
                      type="checkbox"
                      checked={editResetPasswordless}
                      onChange={(event) => setEditResetPasswordless(event.target.checked)}
                    />
                    <span>
                      Reset password without a setup link, allow first login with just a username{' '}
                      <span className="not-recommended">(not recommended)</span>
                    </span>
                  </label>
                  <div className="gift-form__actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleResetPassword(editingUser)}
                    >
                      Reset password
                    </button>
                  </div>
                  {resetSetupLink && (
                    <div className="form-success form-success--panel">
                      <button
                        type="button"
                        className="icon-button form-success__dismiss"
                        aria-label="Dismiss"
                        onClick={() => setResetSetupLink(null)}
                      >
                        <CloseIcon />
                      </button>
                      <p>{resetSetupLink.username} can't log in until they use this one-time setup link:</p>
                      <div className="inline-field">
                        <input
                          className="share-link__input"
                          value={resetSetupLink.url}
                          readOnly
                          onFocus={(event) => event.target.select()}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleCopyLink(resetSetupLink.url, setResetLinkCopied)}
                        >
                          {resetLinkCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                  {resetNotice && (
                    <p className="form-success form-success--panel">
                      <button
                        type="button"
                        className="icon-button form-success__dismiss"
                        aria-label="Dismiss"
                        onClick={() => setResetNotice(null)}
                      >
                        <CloseIcon />
                      </button>
                      {resetNotice}
                    </p>
                  )}
                </div>
              )}

              <form className="gift-form" onSubmit={(event) => handleUsernameSubmit(event, editingUser)}>
                <h3 className="gift-form__badge">Change username</h3>
                <label>
                  Username
                  <input
                    ref={editUsernameInputRef}
                    value={editUsername}
                    onChange={(event) => setEditUsername(event.target.value)}
                    required
                  />
                </label>
                {editUsernameError && <p className="form-error">{editUsernameError}</p>}
                <div className="gift-form__actions">
                  <button type="submit">Save</button>
                  {editUsernameSaved && (
                    <p className="form-success">
                      <span className="form-success__icon">
                        <CheckIcon />
                      </span>
                      Saved
                    </p>
                  )}
                </div>
              </form>

              {editingUser.id !== currentUser.id && (
                <form className="gift-form" onSubmit={(event) => handleAdminSubmit(event, editingUser)}>
                  <h3 className="gift-form__badge">Admin access</h3>
                  <label className="user-admin__checkbox">
                    <input
                      type="checkbox"
                      checked={editIsAdmin}
                      onChange={(event) => setEditIsAdmin(event.target.checked)}
                    />
                    This user has admin access
                  </label>
                  {editAdminError && <p className="form-error">{editAdminError}</p>}
                  <div className="gift-form__actions">
                    <button type="submit">Save</button>
                    {editAdminSaved && (
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

              <h3 className="user-edit-modal__group">Wishlist settings</h3>

              <form className="gift-form" onSubmit={(event) => handleGeneralSubmit(event, editingUser)}>
                <h3 className="gift-form__badge">General</h3>
                <label>
                  List name
                  <input value={editListName} onChange={(event) => setEditListName(event.target.value)} required />
                </label>
                <div className="gift-form__row">
                  <label>
                    Currency
                    <select value={editCurrency} onChange={(event) => setEditCurrency(event.target.value)}>
                      {CURRENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Decimals
                    <select
                      value={editDecimalSeparator}
                      onChange={(event) => setEditDecimalSeparator(event.target.value)}
                    >
                      {DECIMAL_SEPARATOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="user-admin__checkbox">
                  <input
                    type="checkbox"
                    checked={editShowInDirectory}
                    onChange={(event) => setEditShowInDirectory(event.target.checked)}
                  />
                  List this wishlist in the browsable directory
                </label>
                {editGeneralError && <p className="form-error">{editGeneralError}</p>}
                <div className="gift-form__actions">
                  <button type="submit">Save</button>
                  {editGeneralSaved && (
                    <p className="form-success">
                      <span className="form-success__icon">
                        <CheckIcon />
                      </span>
                      Saved
                    </p>
                  )}
                </div>
              </form>

              <form className="gift-form" onSubmit={(event) => handleAppearanceSubmit(event, editingUser)}>
                <h3 className="gift-form__badge">Appearance</h3>
                <label>
                  Theme color
                  <span className="theme-swatches">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className={
                          preset.value === editThemeColor ? 'theme-swatch theme-swatch--selected' : 'theme-swatch'
                        }
                        style={{ backgroundColor: preset.swatchColor }}
                        title={preset.name}
                        aria-label={preset.name}
                        onClick={() => setEditThemeColor(preset.value)}
                      />
                    ))}
                  </span>
                </label>
                <label className="user-admin__checkbox">
                  <input
                    type="checkbox"
                    checked={editShowImagePlaceholder}
                    onChange={(event) => setEditShowImagePlaceholder(event.target.checked)}
                  />
                  Show a placeholder image for items without a photo
                </label>
                <label className="user-admin__checkbox">
                  <input
                    type="checkbox"
                    checked={editShowBackgroundPattern}
                    onChange={(event) => setEditShowBackgroundPattern(event.target.checked)}
                  />
                  Show a subtle background pattern on gift cards
                </label>
                {editAppearanceError && <p className="form-error">{editAppearanceError}</p>}
                <div className="gift-form__actions">
                  <button type="submit">Save</button>
                  {editAppearanceSaved && (
                    <p className="form-success">
                      <span className="form-success__icon">
                        <CheckIcon />
                      </span>
                      Saved
                    </p>
                  )}
                </div>
              </form>

              <form className="gift-form" onSubmit={(event) => handleGuestSubmit(event, editingUser)}>
                <h3 className="gift-form__badge">Guest sorting &amp; filtering</h3>
                <p className="info-block">
                  <InfoIcon />
                  Lets guests browsing this user's list narrow it down themselves. This is handy for longer lists.
                </p>
                <label className="user-admin__checkbox">
                  <input
                    type="checkbox"
                    checked={editGuestSortByPrice}
                    onChange={(event) => setEditGuestSortByPrice(event.target.checked)}
                  />
                  Let guests also sort by price
                </label>
                <label className="user-admin__checkbox">
                  <input
                    type="checkbox"
                    checked={editGuestFilterByLabel}
                    onChange={(event) => setEditGuestFilterByLabel(event.target.checked)}
                  />
                  Let guests filter by label
                </label>
                <label className="user-admin__checkbox">
                  <input
                    type="checkbox"
                    checked={editGuestFilterByBrand}
                    onChange={(event) => setEditGuestFilterByBrand(event.target.checked)}
                  />
                  Let guests filter by brand
                </label>
                {editGuestError && <p className="form-error">{editGuestError}</p>}
                <div className="gift-form__actions">
                  <button type="submit">Save</button>
                  {editGuestSaved && (
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
                <form className="gift-form" onSubmit={(event) => handleClaimSubmit(event, editingUser)}>
                  <h3 className="gift-form__badge">Claim management</h3>
                  <p className="info-block">
                    <InfoIcon />
                    <span>
                      <strong>Caution!</strong> Claims normally stay hidden and anonymous to preserve the surprise.
                      This lets this user deliberately reveal or reset them.
                    </span>
                  </p>
                  <label className="user-admin__checkbox">
                    <input
                      type="checkbox"
                      checked={editClaimManagementEnabled}
                      onChange={(event) => setEditClaimManagementEnabled(event.target.checked)}
                    />
                    Let this user reveal and manage claims on their wishlist
                  </label>
                  {editClaimManagementEnabled && (
                    <label className="user-admin__checkbox">
                      <input
                        type="checkbox"
                        checked={editLockIconClaimedOnly}
                        onChange={(event) => setEditLockIconClaimedOnly(event.target.checked)}
                      />
                      <span>
                        Only show the lock icon on already-claimed items{' '}
                        <span className="not-recommended">(not recommended)</span>
                      </span>
                    </label>
                  )}
                  {editClaimError && <p className="form-error">{editClaimError}</p>}
                  <div className="gift-form__actions">
                    <button type="submit">Save</button>
                    {editClaimSaved && (
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
            </div>
          </section>
        </div>
      )}

      <h3>Add new user</h3>
      <form className="gift-form" onSubmit={handleCreateUser}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        <label className="user-admin__checkbox">
          <input type="checkbox" checked={isAdmin} onChange={(event) => setIsAdmin(event.target.checked)} />
          Make this user an admin
        </label>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={passwordless}
            onChange={(event) => setPasswordless(event.target.checked)}
          />
          <span>
            Allow first login with just a username, no setup link{' '}
            <span className="not-recommended">(not recommended)</span>
          </span>
        </label>
        {userError && <p className="form-error">{userError}</p>}
        {createSetupLink && (
          <div className="form-success form-success--panel">
            <button
              type="button"
              className="icon-button form-success__dismiss"
              aria-label="Dismiss"
              onClick={() => setCreateSetupLink(null)}
            >
              <CloseIcon />
            </button>
            <p>{createSetupLink.username} can't log in yet. Send them this one-time setup link:</p>
            <div className="inline-field">
              <input
                className="share-link__input"
                value={createSetupLink.url}
                readOnly
                onFocus={(event) => event.target.select()}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleCopyLink(createSetupLink.url, setCreateLinkCopied)}
              >
                {createLinkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
        {createNotice && (
          <p className="form-success form-success--panel">
            <button
              type="button"
              className="icon-button form-success__dismiss"
              aria-label="Dismiss"
              onClick={() => setCreateNotice(null)}
            >
              <CloseIcon />
            </button>
            {createNotice}
          </p>
        )}
        <div className="gift-form__actions">
          <button type="submit" disabled={creatingUser}>
            {creatingUser ? (
              <>
                <SpinnerIcon /> Adding…
              </>
            ) : (
              'Add user'
            )}
          </button>
        </div>
      </form>

      <h3>Gift directory</h3>
      <form className="gift-form" onSubmit={handleDirectorySubmit}>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={publicDirectoryEnabled}
            onChange={(event) => setPublicDirectoryEnabled(event.target.checked)}
          />
          Show a directory of public wishlists on the login page
        </label>
        {directoryError && <p className="form-error">{directoryError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {directorySaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Saved
            </p>
          )}
        </div>
      </form>

      <h3>Claim management</h3>
      <form className="gift-form" onSubmit={handleClaimManagementSiteSubmit}>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={claimManagementSiteEnabled}
            onChange={(event) => setClaimManagementSiteEnabled(event.target.checked)}
          />
          Allow wishlist owners to opt into revealing and resetting claims on their own list
        </label>
        <label className="user-admin__checkbox">
          <input
            type="checkbox"
            checked={claimDeleteWarningSkipped}
            onChange={(event) => setClaimDeleteWarningSkipped(event.target.checked)}
          />
          <span>
            Skip the warning when deleting an already-claimed item{' '}
            <span className="not-recommended">(not recommended)</span>
          </span>
        </label>
        {claimManagementSiteError && <p className="form-error">{claimManagementSiteError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {claimManagementSiteSaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Saved
            </p>
          )}
        </div>
      </form>

      <h3>App name</h3>
      <form className="gift-form" onSubmit={handleAppNameSubmit}>
        <input value={appNameInput} onChange={(event) => setAppNameInput(event.target.value)} required />
        {appNameError && <p className="form-error">{appNameError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Change app name</button>
          {appNameSaved && (
            <p className="form-success">
              <span className="form-success__icon">
                <CheckIcon />
              </span>
              Saved
            </p>
          )}
        </div>
      </form>

      <h3>Default theme</h3>
      <form className="gift-form" onSubmit={handleDefaultColorSchemeSubmit}>
        <p className="info-block" style={{ marginTop: 0, marginBottom: 4 }}>
          <InfoIcon />
          Default look for anyone without their own preference set, including wishlist visitors.
        </p>
        <select value={defaultColorScheme} onChange={(event) => setDefaultColorScheme(event.target.value)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto">Match system</option>
        </select>
        {defaultColorSchemeError && <p className="form-error">{defaultColorSchemeError}</p>}
        <div className="gift-form__actions">
          <button type="submit">Save</button>
          {defaultColorSchemeSaved && (
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

export default AdminPage
