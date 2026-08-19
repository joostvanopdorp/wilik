import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Logo from '../components/Logo'
import PublicGiftCard from '../components/PublicGiftCard'
import { GiftIcon, SparkleIcon, SpinnerIcon } from '../components/Icons'
import { sortGifts, sortGiftsByPrice } from '../sortGifts'
import { themeStyle } from '../themePresets'

const API_BASE = '/api'

function uniqueValues(items, field) {
  return [...new Set(items.map((item) => item[field]).filter((value) => value))].sort((a, b) =>
    a.localeCompare(b)
  )
}

// compact input-group-style control: a "Label"/"Brand" prefix + a button that opens a
// checkbox popover, so picking several values doesn't grow into a long row of chips
function MultiSelectFilter({ label, options, selected, onToggle }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const summary = selected.length === 0 ? 'All' : selected.length === 1 ? selected[0] : `${selected.length} selected`

  return (
    <div className="wishlist-toolbar__dropdown" ref={containerRef}>
      <div className="wishlist-toolbar__control">
        <span className="wishlist-toolbar__control-label">{label}</span>
        <button
          type="button"
          className="wishlist-toolbar__control-value"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {summary}
          <span className="wishlist-toolbar__control-caret" />
        </button>
      </div>
      {open && (
        <div className="wishlist-toolbar__popover">
          {options.map((option) => (
            <label key={option} className="wishlist-toolbar__popover-option">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// same input-group chrome and popover as MultiSelectFilter above, but for a single choice:
// radio inputs instead of checkboxes (same left-of-text indicator, shape signals single- vs
// multi-select), and picking an option applies it immediately and closes the popover
function SingleSelectDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const current = options.find((option) => option.value === value)

  return (
    <div className="wishlist-toolbar__dropdown" ref={containerRef}>
      <div className="wishlist-toolbar__control">
        <span className="wishlist-toolbar__control-label">{label}</span>
        <button
          type="button"
          className="wishlist-toolbar__control-value"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {current?.label}
          <span className="wishlist-toolbar__control-caret" />
        </button>
      </div>
      {open && (
        <div className="wishlist-toolbar__popover">
          {options.map((option) => (
            <label key={option.value} className="wishlist-toolbar__popover-option">
              <input
                type="radio"
                name={`sort-${label}`}
                checked={option.value === value}
                onChange={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function PublicWishlistPage({ appName }) {
  const { token } = useParams()
  const [owner, setOwner] = useState(undefined) // undefined = loading, null = invalid link
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sortBy, setSortBy] = useState('recommended')
  const [labelFilters, setLabelFilters] = useState([])
  const [brandFilters, setBrandFilters] = useState([])

  function toggleFilter(setFilters, value) {
    setFilters((current) => (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]))
  }

  useEffect(() => {
    fetch(`${API_BASE}/public/${token}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setOwner)
    fetch(`${API_BASE}/public/${token}/items`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setItems)
      .finally(() => setItemsLoading(false))
  }, [token])

  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: 'include' }).then((response) => setIsLoggedIn(response.ok))
  }, [])

  useEffect(() => {
    document.title = owner ? owner.list_name : appName
  }, [owner, appName])

  function updateItem(updated) {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  function postAction(itemId, action, body) {
    return fetch(`${API_BASE}/public/${token}/items/${itemId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }).then((response) =>
      response.json().then((data) => {
        if (!response.ok) throw new Error(data.error || 'Something went wrong')
        return data
      })
    )
  }

  function claimTokenKey(giftId) {
    return `wilik-claim-${giftId}`
  }

  function handleClaim(gift) {
    const name = prompt("Your name, so others know it's taken:")
    if (!name || !name.trim()) return
    postAction(gift.id, 'claim', { name: name.trim() })
      .then((updated) => {
        if (updated.claim_token) {
          localStorage.setItem(claimTokenKey(gift.id), updated.claim_token)
        }
        updateItem(updated)
      })
      .catch((error) => alert(error.message))
  }

  function handleUnclaim(gift) {
    const claimToken = localStorage.getItem(claimTokenKey(gift.id))
    if (claimToken) {
      postAction(gift.id, 'unclaim', { claim_token: claimToken })
        .then((updated) => {
          localStorage.removeItem(claimTokenKey(gift.id))
          updateItem(updated)
        })
        .catch((error) => alert(error.message))
      return
    }

    // no token on this device: confirm the name first, but only recognize this
    // browser as the claimant -- an actual release still needs a second, explicit click
    const name = prompt('Confirm your name to manage this claim:')
    if (!name || !name.trim()) return
    postAction(gift.id, 'verify-claim', { name: name.trim() })
      .then((data) => {
        if (data.claim_token) {
          localStorage.setItem(claimTokenKey(gift.id), data.claim_token)
        }
        updateItem({ ...gift })
      })
      .catch((error) => alert(error.message))
  }

  // used at quantity > 1 (or unlimited) via the "manage your claim" link: recognizes an
  // existing claim by name without creating or deleting anything, so a visitor who
  // already claimed a copy on another device can find their way back to "Release this
  // gift" instead of accidentally claiming an extra, separate copy
  function handleManageClaim(gift) {
    const name = prompt('Confirm your name to manage your claim:')
    if (!name || !name.trim()) return
    postAction(gift.id, 'verify-claim', { name: name.trim() })
      .then((data) => {
        if (data.claim_token) {
          localStorage.setItem(claimTokenKey(gift.id), data.claim_token)
        }
        updateItem({ ...gift })
      })
      .catch((error) => alert(error.message))
  }

  if (owner === undefined) return null

  if (owner === null) {
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
            <Link to={isLoggedIn ? '/wishlist/browse' : '/directory'}>
              <GiftIcon /> All wishlists
            </Link>
          </div>
        </nav>
        <main>
          <div className="empty-state">
            <GiftIcon width={56} height={56} strokeWidth={1.4} />
            <h3>Link not found</h3>
            <p>This wishlist link doesn't exist (anymore)</p>
          </div>
        </main>
      </div>
    )
  }

  const labelOptions = owner.guest_filter_by_label_enabled ? uniqueValues(items, 'label') : []
  const brandOptions = owner.guest_filter_by_brand_enabled ? uniqueValues(items, 'brand') : []
  const showLabelFilter = labelOptions.length >= 2
  const showBrandFilter = brandOptions.length >= 2
  // rating-based sorting is always on (see sortGifts.js) and always keeps the owner's
  // manual order within a star tier, so the dropdown only needs to appear when there's an
  // actual alternative to offer
  const showSortControl = owner.guest_sort_by_price_enabled
  const showToolbarControls = showSortControl || showLabelFilter || showBrandFilter

  const filtered = items
    .filter((item) => labelFilters.length === 0 || labelFilters.includes(item.label))
    .filter((item) => brandFilters.length === 0 || brandFilters.includes(item.brand))

  const sorted = sortBy === 'price' ? sortGiftsByPrice(filtered) : sortGifts(filtered)

  return (
    <div className="app" style={themeStyle(owner.theme_color)}>
      <nav className="topbar">
        <div className="topbar__left">
          <Link to="/" className="topbar__brand">
            <Logo size={64} />
            <span>{appName}</span>
          </Link>
        </div>
        <div className="topbar__actions">
          <Link to={isLoggedIn ? '/wishlist/browse' : '/directory'}>
            <GiftIcon /> All wishlists
          </Link>
        </div>
      </nav>
      <p className="page__hint" style={{ maxWidth: 700, margin: '0 auto 16px' }}>
        Claim an item by clicking <span className="page__hint-highlight">Get this gift</span> so others know it's
        taken. The recipient won't be notified.
      </p>
      <div className="wishlist-toolbar">
        <h2>{owner.list_name}</h2>
      </div>
      {showToolbarControls && (
        <div className="wishlist-toolbar__controls">
          {showSortControl && (
            <SingleSelectDropdown
              label="Sort"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'recommended', label: 'Highest rated' },
                { value: 'price', label: 'Lowest price' },
              ]}
            />
          )}
          {showLabelFilter && (
            <MultiSelectFilter
              label="Label"
              options={labelOptions}
              selected={labelFilters}
              onToggle={(value) => toggleFilter(setLabelFilters, value)}
            />
          )}
          {showBrandFilter && (
            <MultiSelectFilter
              label="Brand"
              options={brandOptions}
              selected={brandFilters}
              onToggle={(value) => toggleFilter(setBrandFilters, value)}
            />
          )}
        </div>
      )}
      <main>
        <div className="gift-grid">
          {sorted.length === 0 && items.length > 0 && (
            <div className="empty-state">
              <SparkleIcon />
              <h3>No items match your filters</h3>
              <p>Try a different label or brand</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setLabelFilters([])
                  setBrandFilters([])
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          {itemsLoading && (
            <div className="empty-state">
              <SpinnerIcon width={32} height={32} />
              <p>Loading…</p>
            </div>
          )}
          {!itemsLoading && items.length === 0 && (
            <div className="empty-state">
              <SparkleIcon />
              <h3>This wishlist is empty</h3>
              <p>Nothing has been added yet, check back later</p>
            </div>
          )}
          {sorted.map((item) => (
            <PublicGiftCard
              key={item.id}
              gift={item}
              currency={owner.currency}
              decimalSeparator={owner.decimal_separator}
              showBackgroundPattern={owner.show_background_pattern}
              onClaim={handleClaim}
              onUnclaim={handleUnclaim}
              onManageClaim={handleManageClaim}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

export default PublicWishlistPage
