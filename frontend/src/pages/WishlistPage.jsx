import { useState, useEffect } from 'react'
import GiftCard from '../components/GiftCard'
import GiftForm from '../components/GiftForm'
import { PlusIcon, SparkleIcon, GripIcon } from '../components/Icons'
import { sortGifts } from '../sortGifts'

const API_BASE = '/api'
const API_URL = `${API_BASE}/items`

function WishlistPage({ currentUser }) {
  const [items, setItems] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [claimManagementSiteEnabled, setClaimManagementSiteEnabled] = useState(false)
  const [claimDeleteWarningSkipped, setClaimDeleteWarningSkipped] = useState(false)
  const [dragState, setDragState] = useState({
    draggedId: null,
    draggedRating: undefined,
    overId: null,
    x: 0,
    y: 0,
  })

  useEffect(() => {
    fetch(API_URL, { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => setItems(data))
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((response) => response.json())
      .then((data) => {
        setClaimManagementSiteEnabled(data.claim_management_site_enabled)
        setClaimDeleteWarningSkipped(data.claim_delete_warning_skipped)
      })
  }, [])

  const claimManagementEnabled = currentUser.claim_management_enabled && claimManagementSiteEnabled

  function handleRatingChange(id, rating) {
    fetch(`${API_URL}/${id}/rating`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
      .then((response) => response.json())
      .then((updatedGift) => {
        setItems((current) =>
          current.map((item) => (item.id === updatedGift.id ? updatedGift : item))
        )
      })
  }

  function handleCreate(values) {
    fetch(API_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((newGift) => {
        setItems((current) => [...current, newGift])
        setIsAdding(false)
      })
  }

  function handleUpdate(id, values) {
    fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((updatedGift) => {
        setItems((current) =>
          current.map((item) => (item.id === updatedGift.id ? updatedGift : item))
        )
      })
  }

  function handleDelete(id) {
    fetch(`${API_URL}/${id}`, { method: 'DELETE', credentials: 'include' }).then(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    })
  }

  function handleReceivedChange(id, received) {
    fetch(`${API_URL}/${id}/received`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received }),
    })
      .then((response) => response.json())
      .then((updatedGift) => {
        setItems((current) => current.map((item) => (item.id === updatedGift.id ? updatedGift : item)))
      })
  }

  function handleClaimsReset(updatedGift) {
    setItems((current) => current.map((item) => (item.id === updatedGift.id ? updatedGift : item)))
  }

  function handleReorder(draggedId, targetId) {
    const dragged = items.find((item) => item.id === draggedId)
    const target = items.find((item) => item.id === targetId)
    if (!dragged || !target) return
    if (dragged.rating !== target.rating) {
      alert('Gifts can only be reordered within the same star rating.')
      return
    }

    const group = sortGifts(items).filter((item) => item.rating === dragged.rating)
    const withoutDragged = group.filter((item) => item.id !== draggedId)
    const targetIndex = withoutDragged.findIndex((item) => item.id === targetId)
    withoutDragged.splice(targetIndex, 0, dragged)

    const reordered = withoutDragged.map((item, index) => ({ id: item.id, sort_order: index }))

    setItems((current) =>
      current.map((item) => {
        const match = reordered.find((r) => r.id === item.id)
        return match ? { ...item, sort_order: match.sort_order } : item
      })
    )

    reordered.forEach(({ id, sort_order }) => {
      fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order }),
      })
    })
  }

  function handleDragStart(id, rating) {
    setDragState((current) => ({ ...current, draggedId: id, draggedRating: rating, overId: null }))
  }

  function handleDragMove(x, y) {
    setDragState((current) => ({ ...current, x, y }))
  }

  function handleDragEnter(id) {
    setDragState((current) => ({ ...current, overId: id }))
  }

  function handleDragEnd() {
    setDragState({ draggedId: null, draggedRating: undefined, overId: null, x: 0, y: 0 })
  }

  const draggedItem = dragState.draggedId != null ? items.find((item) => item.id === dragState.draggedId) : null

  const activeItems = items.filter((item) => !item.received)

  return (
    <>
      <div className="wishlist-toolbar">
        <h2>{currentUser.list_name}</h2>
        <button
          className={isAdding ? undefined : 'btn-primary'}
          type="button"
          onClick={() => setIsAdding((current) => !current)}
        >
          {isAdding ? (
            'Cancel'
          ) : (
            <>
              <PlusIcon width={14} height={14} strokeWidth={3} /> New item
            </>
          )}
        </button>
      </div>
      <main>
        <div className="gift-grid">
          {isAdding && (
            <GiftForm
              defaultCurrency={currentUser.currency}
              onSubmit={handleCreate}
              onCancel={() => setIsAdding(false)}
            />
          )}
          {!isAdding && activeItems.length === 0 && (
            <div className="empty-state">
              <SparkleIcon />
              <h3>Your wishlist is empty</h3>
              <p>Add your first gift idea to get started</p>
              <button className="btn-primary" type="button" onClick={() => setIsAdding(true)}>
                <PlusIcon width={14} height={14} strokeWidth={3} /> New item
              </button>
            </div>
          )}
          {sortGifts(activeItems).map((item) => (
            <GiftCard
              key={item.id}
              gift={item}
              currency={currentUser.currency}
              decimalSeparator={currentUser.decimal_separator}
              showImagePlaceholder={currentUser.show_image_placeholder}
              showBackgroundPattern={currentUser.show_background_pattern}
              claimManagementEnabled={claimManagementEnabled}
              lockIconClaimedOnly={currentUser.lock_icon_claimed_only}
              claimDeleteWarningSkipped={claimDeleteWarningSkipped}
              onRatingChange={handleRatingChange}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onReceivedChange={handleReceivedChange}
              onClaimsReset={handleClaimsReset}
              dragState={dragState}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </main>
      {draggedItem && (
        <div
          className="gift-card__drag-ghost"
          style={{ left: dragState.x, top: dragState.y }}
        >
          <GripIcon />
          <span className="gift-card__drag-ghost-title">{draggedItem.title}</span>
        </div>
      )}
    </>
  )
}

export default WishlistPage
