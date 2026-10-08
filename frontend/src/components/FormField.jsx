import { inputClass } from '../lib/styles.js'

// A labeled input. Pass as="select" or as="textarea" for those controls.
export default function FormField({ label, id, error, hint, as: Control = 'input', children, ...controlProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      <Control id={id} className={inputClass} {...controlProps}>
        {children}
      </Control>
      {hint && !error && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
