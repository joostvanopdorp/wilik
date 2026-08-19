import { useEffect, useRef, useState } from 'react'
import StarRating from './StarRating'
import GiftForm from './GiftForm'
import ImagePlaceholder from './ImagePlaceholder'
import { PencilIcon, TrashIcon, ExternalLinkIcon, GripIcon, CheckIcon, UndoIcon, LockIcon, CloseIcon } from './Icons'
import { formatPrice } from '../formatPrice'

const API_BASE = '/api'

function GiftCard({
  gift,
  currency,
  decimalSeparator,
  showImagePlaceholder,
  showBackgroundPattern,
  claimManagementEnabled,
  lockIconClaimedOnly,
  claimDeleteWarningSkipped,
  onRatingChange,
  onUpdate,
  onDelete,
  onReorder,
  onReceivedChange,
  onClaimsReset,
  dragState,
  onDragStart,
  onDragMove,
  onDragEnter,
  onDragEnd,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [claimManagerOpen, setClaimManagerOpen] = useState(false)
  const [claimants, setClaimants] = useState(null)
  const [claimError, setClaimError] = useState(null)
  const [claimActionPending, setClaimActionPending] = useState(false)
  const [deleteNoticeOpen, setDeleteNoticeOpen] = useState(false)
  const [deleteNoticeCount, setDeleteNoticeCount] = useState(0)
  const [deleteClaimants, setDeleteClaimants] = useState(null)
  const [deleteClaimError, setDeleteClaimError] = useState(null)
  const [deleteRevealPending, setDeleteRevealPending] = useState(false)
  const claimManagerRef = useRef(null)
  const deleteNoticeRef = useRef(null)

  useEffect(() => {
    const activeRef = claimManagerOpen ? claimManagerRef : deleteNoticeOpen ? deleteNoticeRef : null
    if (!activeRef) return undefined

    const previouslyFocused = document.activeElement
    activeRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setClaimManagerOpen(false)
        setDeleteNoticeOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [claimManagerOpen, deleteNoticeOpen])

  if (isEditing) {
    return (
      <GiftForm
        initialValues={gift}
        defaultCurrency={currency}
        onSubmit={(values) => {
          onUpdate(gift.id, values)
          setIsEditing(false)
        }}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  const lastSpace = gift.title.lastIndexOf(' ')
  const titleHead = lastSpace === -1 ? '' : gift.title.slice(0, lastSpace + 1)
  const titleTail = lastSpace === -1 ? gift.title : gift.title.slice(lastSpace + 1)

  const isDragActive = dragState.draggedId != null
  const isDragging = dragState.draggedId === gift.id
  const isValidTarget = dragState.draggedRating === gift.rating
  const isDragOver = dragState.overId === gift.id && isValidTarget

  const classNames = ['gift-card']
  if (gift.url) classNames.push('gift-card--clickable')
  if (isDragOver) classNames.push('gift-card--drag-over')
  if (isDragActive && !isDragging && !isValidTarget) classNames.push('gift-card--drag-invalid')
  if (showBackgroundPattern) classNames.push('gift-card--pattern')

  function handlePointerDown(event) {
    if (event.target.closest('.gift-card__action-bar-buttons')) return
    event.preventDefault()
    onDragStart(gift.id, gift.rating)
    onDragMove(event.clientX, event.clientY)

    function handlePointerMove(moveEvent) {
      onDragMove(moveEvent.clientX, moveEvent.clientY)
      const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)
      const card = el && el.closest('.gift-card')
      onDragEnter(card ? Number(card.dataset.giftId) : null)
    }

    function finishDrag(upEvent) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
      const el = document.elementFromPoint(upEvent.clientX, upEvent.clientY)
      const card = el && el.closest('.gift-card')
      const targetId = card ? Number(card.dataset.giftId) : null
      onDragEnd()
      if (targetId != null && targetId !== gift.id) {
        onReorder(gift.id, targetId)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)
  }

  function openClaimManager(event) {
    event.stopPropagation()
    setClaimants(null)
    setClaimError(null)
    setClaimManagerOpen(true)
  }

  function revealClaimants() {
    setClaimActionPending(true)
    setClaimError(null)
    fetch(`${API_BASE}/items/${gift.id}/claims`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) return response.json().then((data) => Promise.reject(new Error(data.error)))
        return response.json()
      })
      .then((data) => setClaimants(data.claimed_by))
      .catch((error) => setClaimError(error.message || 'Could not reveal claimants'))
      .finally(() => setClaimActionPending(false))
  }

  function revealForDelete() {
    setDeleteRevealPending(true)
    setDeleteClaimError(null)
    fetch(`${API_BASE}/items/${gift.id}/claims`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) return response.json().then((data) => Promise.reject(new Error(data.error)))
        return response.json()
      })
      .then((data) => setDeleteClaimants(data.claimed_by))
      .catch((error) => setDeleteClaimError(error.message || 'Could not reveal claimants'))
      .finally(() => setDeleteRevealPending(false))
  }

  function resetClaims() {
    const count = gift.claimed_count ?? 0
    const proceed = confirm(
      `Reset ${count === 1 ? 'the claim' : `all ${count} claims`} for "${gift.title}"? Visitors will be able to claim it again.`
    )
    if (!proceed) return

    setClaimActionPending(true)
    setClaimError(null)
    fetch(`${API_BASE}/items/${gift.id}/claims`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) return response.json().then((data) => Promise.reject(new Error(data.error)))
        return response.json()
      })
      .then((updatedGift) => {
        onClaimsReset(updatedGift)
        setClaimManagerOpen(false)
      })
      .catch((error) => setClaimError(error.message || 'Could not reset claims'))
      .finally(() => setClaimActionPending(false))
  }

  return (
    <div
      className={classNames.join(' ')}
      data-gift-id={gift.id}
      onClick={gift.url ? () => window.open(gift.url, '_blank', 'noopener,noreferrer') : undefined}
    >
      <div
        className="gift-card__action-bar"
        title="Drag to reorder within this star rating"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={handlePointerDown}
      >
        <span className="gift-card__drag-handle">
          <GripIcon />
        </span>
        <span className="gift-card__action-bar-buttons">
          {claimManagementEnabled && (!lockIconClaimedOnly || (gift.claimed_count ?? 0) > 0) && (
            <button
              type="button"
              className="icon-button"
              aria-label="Manage claims"
              title="Manage claims"
              onClick={openClaimManager}
            >
              <LockIcon />
            </button>
          )}
          {onReceivedChange && (
            <button
              type="button"
              className="icon-button"
              aria-label={gift.received ? 'Move back to wishlist' : 'Received'}
              title={gift.received ? 'Move back to wishlist' : 'Received'}
              onClick={(event) => {
                event.stopPropagation()
                if (gift.quantity == null && !gift.received) {
                  // unlimited items never "run out" -- marking one received shouldn't
                  // archive the whole item away, just clear whatever's been claimed so
                  // far; ask first (with a count) since this isn't the usual behavior
                  fetch(`${API_BASE}/items/${gift.id}/claim-info`, { credentials: 'include' })
                    .then((response) => response.json())
                    .then((data) => {
                      const count = data.claimed_count
                      const proceed = confirm(
                        count > 0
                          ? `This item has unlimited quantity, so marking it received won't remove it from your list. It'll just clear the ${count} existing claim${count === 1 ? '' : 's'} so people can keep gifting it. Continue?`
                          : `This item has unlimited quantity, so marking it received won't remove it from your list. Continue?`
                      )
                      if (proceed) onReceivedChange(gift.id, true)
                    })
                  return
                }
                onReceivedChange(gift.id, !gift.received)
              }}
            >
              {gift.received ? <UndoIcon /> : <CheckIcon />}
            </button>
          )}
          <button
            type="button"
            className="icon-button"
            aria-label="Edit"
            title="Edit"
            onClick={(event) => {
              event.stopPropagation()
              setIsEditing(true)
            }}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Delete"
            title="Delete"
            onClick={(event) => {
              event.stopPropagation()
              fetch(`${API_BASE}/items/${gift.id}/claim-info`, { credentials: 'include' })
                .then((response) => response.json())
                .then((data) => {
                  if (data.claimed_count === 0 || claimDeleteWarningSkipped) {
                    if (confirm(`Delete "${gift.title}"?`)) onDelete(gift.id)
                    return
                  }
                  setDeleteNoticeCount(data.claimed_count)
                  setDeleteClaimants(null)
                  setDeleteClaimError(null)
                  setDeleteNoticeOpen(true)
                })
            }}
          >
            <TrashIcon />
          </button>
        </span>
      </div>
      {claimManagerOpen && (
        <div
          className="claim-manager__backdrop"
          role="presentation"
          onClick={(event) => {
            event.stopPropagation()
            if (!claimActionPending) setClaimManagerOpen(false)
          }}
        >
          <section
            ref={claimManagerRef}
            className="claim-manager"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`claim-manager-title-${gift.id}`}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button claim-manager__close"
              aria-label="Close"
              title="Close"
              onClick={() => setClaimManagerOpen(false)}
              disabled={claimActionPending}
            >
              <CloseIcon />
            </button>
            <h3 id={`claim-manager-title-${gift.id}`}>Manage claims</h3>
            <p>
              “{gift.title}”{' '}
              {(gift.claimed_count ?? 0) === 0
                ? 'has no active claims'
                : `has ${gift.claimed_count} active ${gift.claimed_count === 1 ? 'claim' : 'claims'}`}
            </p>
            {(gift.claimed_count ?? 0) > 0 && claimants === null && (
              <p className="claim-manager__hint">
                Names stay hidden until you choose to reveal{'\u00A0'}them
              </p>
            )}
            {claimants !== null && (
              <div className="claim-manager__names">
                <strong>Claimed by</strong>
                <ul>
                  {claimants.map((name, index) => (
                    <li key={`${name}-${index}`}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
            {claimError && <p className="form-error">{claimError}</p>}
            {(gift.claimed_count ?? 0) > 0 && (
              <div className="claim-manager__actions">
                {claimants === null && (
                  <button type="button" className="btn-primary" onClick={revealClaimants} disabled={claimActionPending}>
                    Reveal {gift.claimed_count === 1 ? 'name' : 'names'}
                  </button>
                )}
                <button type="button" className="btn-danger" onClick={resetClaims} disabled={claimActionPending}>
                  Reset {gift.claimed_count === 1 ? 'claim' : 'all claims'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      {deleteNoticeOpen && (
        <div
          className="claim-manager__backdrop"
          role="presentation"
          onClick={(event) => {
            event.stopPropagation()
            setDeleteNoticeOpen(false)
          }}
        >
          <section
            ref={deleteNoticeRef}
            className="claim-manager"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-notice-title-${gift.id}`}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button claim-manager__close"
              aria-label="Close"
              title="Close"
              onClick={() => setDeleteNoticeOpen(false)}
            >
              <CloseIcon />
            </button>
            <h3 id={`delete-notice-title-${gift.id}`}>Delete claimed item?</h3>
            {deleteClaimants === null && (
              <p>
                “{gift.title}” has been claimed by{' '}
                {deleteNoticeCount === 1 ? 'someone' : `${deleteNoticeCount} people`}: reveal who, or delete without
                knowing
              </p>
            )}
            {!gift.received && onReceivedChange && (
              <p className="claim-manager__suggestion">
                If you already received this gift, use the checkmark instead to archive it
              </p>
            )}
            {deleteClaimants !== null && (
              <div className="claim-manager__names">
                <strong>Claimed by</strong>
                <ul>
                  {deleteClaimants.map((name, index) => (
                    <li key={`${name}-${index}`}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
            {deleteClaimError && <p className="form-error">{deleteClaimError}</p>}
            <div className="claim-manager__actions">
              {deleteClaimants === null && (
                <button type="button" className="btn-primary" onClick={revealForDelete} disabled={deleteRevealPending}>
                  Reveal {deleteNoticeCount === 1 ? 'name' : 'names'}
                </button>
              )}
              <button
                type="button"
                className="btn-danger"
                disabled={deleteRevealPending}
                onClick={() => {
                  setDeleteNoticeOpen(false)
                  onDelete(gift.id)
                }}
              >
                {deleteClaimants === null ? 'Delete without knowing' : 'Delete'}
              </button>
            </div>
          </section>
        </div>
      )}
      {gift.image_url ? (
        <img className="gift-card__img" src={gift.image_url} alt={gift.title} />
      ) : (
        showImagePlaceholder && <ImagePlaceholder id={gift.id} />
      )}
      <div className="gift-card__body">
        {(gift.label || gift.brand) && (
          <p className="gift-card__eyebrow">
            {gift.label && <span className="gift-card__label">{gift.label}</span>}
            {gift.label && gift.brand && <span className="gift-card__eyebrow-sep">·</span>}
            {gift.brand && <span className="gift-card__brand">{gift.brand}</span>}
          </p>
        )}
        <h3>
          {titleHead}
          <span className="gift-card__title-tail">
            {titleTail}
            {gift.url && <ExternalLinkIcon className="gift-card__link-icon" />}
          </span>
        </h3>
        {gift.options && (
          <span className="gift-card__options">
            {gift.options
              .split(';')
              .map((option) => option.trim())
              .filter(Boolean)
              .map((option, index) => (
                <span key={index} className="gift-card__option-badge">
                  {option}
                </span>
              ))}
          </span>
        )}
        {gift.description && (
          <p className="gift-card__desc" title={gift.description}>
            {gift.description}
          </p>
        )}
        {(gift.price != null || gift.rating != null) && (
          <div className="gift-card__footer">
            {gift.price != null && (
              <span className="gift-price">{formatPrice(gift.price, gift.currency ?? currency, decimalSeparator)}</span>
            )}
            {gift.rating != null && (
              <StarRating value={gift.rating} onChange={(newRating) => onRatingChange(gift.id, newRating)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GiftCard
