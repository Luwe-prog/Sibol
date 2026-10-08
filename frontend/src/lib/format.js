const dateTimeFormat = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export const formatDateTime = (value) => (value ? dateTimeFormat.format(new Date(value)) : '')

// Up to two decimals, without trailing zeros: 12.5, 70, 0.75.
export const formatNumber = (value) => (value === null || value === undefined ? '' : String(Math.round(Number(value) * 100) / 100))

// Value for <input type="datetime-local"> in the device's own time zone.
export const toLocalInputValue = (value) => {
  const date = value ? new Date(value) : new Date()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export const fromLocalInputValue = (value) => new Date(value).toISOString()

const shortDateFormat = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' })

export const formatShortDate = (value) => shortDateFormat.format(new Date(value))

const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

// "5 minutes ago", "3 hours ago", "yesterday", "4 days ago".
export const formatRelative = (value) => {
  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000)
  if (Math.abs(minutes) < 1) return 'just now'
  if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relativeFormat.format(hours, 'hour')
  return relativeFormat.format(Math.round(hours / 24), 'day')
}

// Value for <input type="date">: today, or a number of days before today, in the device's time zone.
export const dateInputValue = (daysAgo = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return toLocalInputValue(date).slice(0, 10)
}

const longDateFormat = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })

// For a date input value such as "2026-10-08".
export const formatDateValue = (dateValue) => longDateFormat.format(new Date(`${dateValue}T00:00:00`))

// A date input gives "2026-10-08" in the device's time zone; the API wants exact instants.
export const startOfDayIso = (dateValue) => new Date(`${dateValue}T00:00:00`).toISOString()
export const endOfDayIso = (dateValue) => new Date(`${dateValue}T23:59:59.999`).toISOString()
