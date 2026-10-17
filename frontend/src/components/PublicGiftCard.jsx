import StarRating from './StarRating'
import GiftImage from './GiftImage'
import { GiftIcon, LockIcon, UndoIcon, ExternalLinkIcon } from './Icons'
import { formatPrice } from '../formatPrice'

function PublicGiftCard({ gift, currency, decimalSeparator, showBackgroundPattern, onClaim, onUnclaim, onManageClaim }) {
  const lastSpace = gift.title.lastIndexOf(' ')
  const titleHead = lastSpace === -1 ? '' : gift.title.slice(0, lastSpace + 1)
  const titleTail = lastSpace === -1 ? gift.title : gift.title.slice(lastSpace + 1)

  const claimedCount = gift.claimed_count ?? 0
  const fullyClaimed = Boolean(gift.fully_claimed)
  const isOwnClaim = claimedCount > 0 && Boolean(localStorage.getItem(`wilik-claim-${gift.id}`))

  const classNames = ['gift-card']
  if (gift.url) classNames.push('gift-card--clickable')
  if (fullyClaimed) classNames.push('gift-card--fully-claimed')
  if (showBackgroundPattern) classNames.push('gift-card--pattern')

  // "Claim" and "release a claim by name" are two deliberately distinct actions (even at
  // quantity=1, where the single button already does both depending on state) so that a
  // typo while trying to release a claim can never silently create an unwanted extra one.
  let icon, visibleText, tooltip, clickable, handleClick
  if (isOwnClaim) {
    icon = <UndoIcon />
    visibleText = 'Release this gift'
    tooltip = 'Release this gift'
    clickable = true
    handleClick = () => onUnclaim(gift)
  } else if (gift.quantity === 1) {
    // quantity=1 behaves exactly as it always has -- same text, same tooltip, same click
    if (claimedCount > 0) {
      icon = <LockIcon />
      visibleText = 'Gift claimed'
      tooltip = 'Gift claimed — click to unclaim'
      clickable = true
      handleClick = () => onUnclaim(gift)
    } else {
      icon = <GiftIcon />
      visibleText = 'Get this gift'
      tooltip = 'Get this gift'
      clickable = true
      handleClick = () => onClaim(gift)
    }
  } else if (fullyClaimed) {
    icon = <LockIcon />
    visibleText = gift.quantity != null ? `Fully claimed (${claimedCount} of ${gift.quantity})` : 'Fully claimed'
    tooltip = visibleText
    clickable = false
    handleClick = undefined
  } else {
    icon = <GiftIcon />
    if (claimedCount === 0) {
      visibleText = 'Get this gift'
    } else if (gift.quantity != null) {
      visibleText = `Also get this gift (${claimedCount} of ${gift.quantity} claimed)`
    } else {
      visibleText = `Also get this gift (${claimedCount} claimed)`
    }
    tooltip = visibleText
    clickable = true
    handleClick = () => onClaim(gift)
  }

  // only relevant once quantity allows more than one claim -- at quantity=1 the main
  // button already covers "recognize my claim from another device" on its own
  const showManageClaimLink = gift.quantity !== 1 && claimedCount > 0 && !isOwnClaim

  return (
    <div className="gift-card-wrapper">
      <div
        className={classNames.join(' ')}
        onClick={gift.url ? () => window.open(gift.url, '_blank', 'noopener,noreferrer') : undefined}
      >
        <GiftImage gift={gift} />
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
              {gift.rating != null && <StarRating value={gift.rating} onChange={() => {}} readOnly />}
            </div>
          )}
        </div>
        <button
          type="button"
          className={fullyClaimed ? 'gift-card__claim-rail gift-card__claim-rail--claimed' : 'gift-card__claim-rail'}
          aria-label={tooltip}
          title={tooltip}
          disabled={!clickable}
          onClick={
            clickable
              ? (event) => {
                  event.stopPropagation()
                  handleClick()
                }
              : undefined
          }
        >
          {icon}
          {visibleText}
        </button>
      </div>
      {showManageClaimLink && (
        <button
          type="button"
          className="gift-card__manage-claim"
          onClick={(event) => {
            event.stopPropagation()
            onManageClaim(gift)
          }}
        >
          Already claimed this? Manage your claim
        </button>
      )}
    </div>
  )
}

export default PublicGiftCard
