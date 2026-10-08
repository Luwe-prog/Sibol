import { inputClass, textareaClass } from '../lib/styles.js'
import { AppIcon } from './icons.jsx'

// A labeled control. Pass as="select" or as="textarea" for those, and unit="%" to show a unit inside the field.
export default function FormField({ label, id, error, hint, unit, optional, as: Control = 'input', children, className = '', ...controlProps }) {
  const isSelect = Control === 'select'
  const isTextarea = Control === 'textarea'

  const classes = [
    isTextarea ? textareaClass : inputClass,
    isSelect ? 'appearance-none pr-10' : '',
    unit ? 'pr-12' : '',
    error ? 'border-red-700' : '',
    className,
  ].join(' ')

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-stone-800">
        {label}
        {optional && <span className="font-normal text-stone-600"> (optional)</span>}
      </label>
      <div className="relative">
        <Control
          id={id}
          className={classes}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...controlProps}
        >
          {children}
        </Control>
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-base font-medium text-stone-600">
            {unit}
          </span>
        )}
        {isSelect && <AppIcon name="chevron-down" className="pointer-events-none absolute right-3.5 top-3.5 h-5 w-5 text-stone-700" />}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-stone-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700">
          <AppIcon name="alert-circle" className="mt-0.5 h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  )
}
