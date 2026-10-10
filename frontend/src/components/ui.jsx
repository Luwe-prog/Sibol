import { useEffect, useId } from 'react'
import { Link } from 'react-router-dom'
import { FLAG } from '../lib/status.js'
import { backLinkClass, btnDangerSolid, btnPrimary, btnSecondary, btnSmall, cardClass } from '../lib/styles.js'
import { AppIcon, Spinner } from './icons.jsx'

// `back` is { to, label } for a link above the title.
export function PageHeader({ title, subtitle, back, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {back && (
          <Link to={back.to} className={backLinkClass}>
            <AppIcon name="chevron-left" className="h-4 w-4" />
            {back.label}
          </Link>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function Card({ title, aside, children, className = '' }) {
  return (
    <section className={`${cardClass} ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5 sm:py-4">
          <h2 className="text-lg font-semibold text-charcoal">{title}</h2>
          {aside}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

// `onRetry` adds a "Try again" button.
export function ErrorAlert({ children, onRetry }) {
  if (!children) return null
  return (
    <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      <AppIcon name="alert-circle" className="mt-0.5 h-5 w-5" />
      <div>
        <p className="text-[15px] font-semibold">{children}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg border border-red-300 bg-white px-3.5 text-sm font-semibold text-red-800 hover:bg-red-50"
          >
            <AppIcon name="refresh" className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

export function SuccessMessage({ children, onDismiss }) {
  if (!children) return null
  return (
    <div role="status" className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 py-1.5 pl-4 pr-1.5 text-green-800">
      <AppIcon name="optimal" className="h-5 w-5" />
      <p className="flex-1 text-[15px] font-semibold">{children}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-green-100"
        >
          <AppIcon name="x" className="h-5 w-5" />
        </button>
      ) : (
        <span className="h-11" />
      )}
    </div>
  )
}

export function Loading() {
  return (
    <p className="flex items-center justify-center gap-2.5 py-12 text-stone-600" role="status">
      <Spinner aria-hidden="true" className="h-5 w-5 animate-spin text-green-800" />
      Loading…
    </p>
  )
}

export function EmptyState({ icon = 'sprout', title, children }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-800">
        <AppIcon name={icon} className="h-6 w-6" />
      </span>
      {title && <p className="mt-3 text-lg font-semibold text-charcoal">{title}</p>}
      <div className="mt-1 max-w-md text-[15px] text-stone-600">{children}</div>
    </div>
  )
}

// Pass a palette's `badge` classes as className, and an icon name from the icon set.
export function Badge({ className = FLAG.neutral.badge, icon, children }) {
  return (
    <span className={`badge ${className}`}>
      {icon && <AppIcon name={icon} />}
      {children}
    </span>
  )
}

// A status from lib/status.js as a badge: <StatusBadge status={MOISTURE_STATUS.too_dry} />.
export function StatusBadge({ status, label }) {
  return (
    <Badge className={status.badge} icon={status.icon}>
      {label ?? status.label}
    </Badge>
  )
}

export function InactiveBadge() {
  return <StatusBadge status={FLAG.inactive} />
}

export function Checkbox({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="-mx-3 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 text-[15px] text-stone-800 hover:bg-cream">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
      />
      {label}
    </label>
  )
}

// One window component: centered on a laptop, a bottom sheet on a phone so the buttons sit under the thumb.
// `footer` is the row of buttons; `narrow` is for confirmations.
export function Modal({ title, onClose, children, footer, narrow = false, role = 'dialog' }) {
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-green-950/40 sm:items-center sm:p-6 print:hidden">
      <div
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl shadow-green-950/20 sm:rounded-xl ${narrow ? 'sm:max-w-md' : 'sm:max-w-lg'}`}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-stone-300 sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 sm:px-6 sm:py-4">
          <h2 id={titleId} className="text-lg font-semibold text-charcoal">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100"
          >
            <AppIcon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-cream px-5 pb-6 pt-3 sm:flex-row sm:justify-end sm:rounded-b-xl sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// The row of buttons at the bottom of a form inside a Modal.
export function FormActions({ onCancel, saving, saveLabel, savingLabel = 'Saving…' }) {
  return (
    <div className="-mx-5 -mb-5 mt-6 flex flex-col-reverse gap-2 border-t border-line bg-cream px-5 pb-6 pt-3 sm:-mx-6 sm:flex-row sm:justify-end sm:rounded-b-xl sm:px-6 sm:py-4">
      <button type="button" className={`w-full sm:w-auto ${btnSecondary}`} onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className={`w-full sm:w-auto ${btnPrimary}`} disabled={saving}>
        {saving ? savingLabel : saveLabel}
      </button>
    </div>
  )
}

// Replaces the browser's plain confirm pop-up. `danger` makes the confirm button red.
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel, danger = false, busy = false }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      narrow
      role="alertdialog"
      footer={
        <>
          <button type="button" className={`w-full sm:w-auto ${btnSecondary}`} onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type="button" className={`w-full sm:w-auto ${danger ? btnDangerSolid : btnPrimary}`} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        {danger && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
            <AppIcon name="trash" className="h-5 w-5" />
          </span>
        )}
        <div className="text-[15px] leading-6 text-stone-700">{children}</div>
      </div>
    </Modal>
  )
}

// `meta` is { current_page, last_page, total } from the API; `noun` is "reading" or "entry".
export function Pagination({ meta, noun, plural, onPage }) {
  if (!meta) return null

  return (
    <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
      <p>
        <span className="font-semibold text-stone-900">{meta.total}</span> {meta.total === 1 ? noun : (plural ?? `${noun}s`)}
      </p>
      {meta.last_page > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" className={btnSmall} disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
            <AppIcon name="chevron-left" className="h-4 w-4" />
            Previous
          </button>
          <span className="px-1 font-semibold text-stone-800">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            type="button"
            className={btnSmall}
            disabled={meta.current_page >= meta.last_page}
            onClick={() => onPage(meta.current_page + 1)}
          >
            Next
            <AppIcon name="chevron-right" className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  )
}
