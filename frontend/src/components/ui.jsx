import { useEffect } from 'react'

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1 text-stone-600">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function ErrorAlert({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  )
}

export function Loading() {
  return <p className="py-10 text-center text-stone-500">Loading…</p>
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-stone-500">
      {children}
    </div>
  )
}

export function Badge({ className, children }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>
}

export function InactiveBadge() {
  return <Badge className="bg-stone-200 text-stone-700">Inactive</Badge>
}

export function Checkbox({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-stone-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-stone-300 text-green-700 focus:ring-green-600"
      />
      {label}
    </label>
  )
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-stone-900/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-full w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-xl leading-none text-stone-500 hover:bg-stone-100"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
