import { useEffect, useRef } from 'react'
import { CloseIcon } from './Icons'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function Modal({
  open,
  onClose,
  closeDisabled = false,
  initialFocusRef,
  // optional: include when the dialog can switch to a different logical target
  // (e.g. a different user) without unmounting, so focus is re-established for
  // the new target instead of only on the initial open
  focusKey,
  titleId,
  className = '',
  backdropClassName = '',
  children,
}) {
  const dialogRef = useRef(null)
  // kept in sync every render so the Escape handler below always calls the latest
  // onClose without needing it in the effect's deps (which would tear down and
  // rebuild the listener -- and re-focus the dialog -- on every parent re-render)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    ;(initialFocusRef?.current ?? dialogRef.current)?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (!closeDisabled) onCloseRef.current()
        return
      }
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR)
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
  }, [open, closeDisabled, initialFocusRef, focusKey])

  if (!open) return null

  return (
    <div
      className={`modal__backdrop ${backdropClassName}`}
      role="presentation"
      onClick={(event) => {
        event.stopPropagation()
        if (!closeDisabled) onClose()
      }}
    >
      <section
        ref={dialogRef}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="icon-button modal__close"
          aria-label="Close"
          title="Close"
          onClick={onClose}
          disabled={closeDisabled}
        >
          <CloseIcon />
        </button>
        {children}
      </section>
    </div>
  )
}

export default Modal
