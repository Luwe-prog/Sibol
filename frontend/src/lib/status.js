// The one place every status, flag and badge color comes from.
// Class names are written out in full so Tailwind can find them. A status never shows
// as color alone: each has its word and its own icon (see components/icons.jsx).

const AMBER = {
  card: 'border-amber-300',
  head: 'border-amber-300 bg-amber-50 text-amber-800',
  tile: 'border-amber-300 bg-amber-50',
  badge: 'badge-dry',
  text: 'text-amber-800',
  num: 'text-amber-900',
  soft: 'bg-amber-50 text-amber-900',
}
const GREEN = {
  card: 'border-green-300',
  head: 'border-green-300 bg-green-50 text-green-800',
  tile: 'border-green-300 bg-green-50',
  badge: 'badge-optimal',
  text: 'text-green-800',
  num: 'text-green-900',
  soft: 'bg-green-50 text-green-900',
}
const BLUE = {
  card: 'border-blue-300',
  head: 'border-blue-300 bg-blue-50 text-blue-800',
  tile: 'border-blue-300 bg-blue-50',
  badge: 'badge-wet',
  text: 'text-blue-800',
  num: 'text-blue-900',
  soft: 'bg-blue-50 text-blue-900',
}
const RED = { badge: 'badge-hot', text: 'text-red-800' }
const ORANGE = { badge: 'badge-warning', text: 'text-orange-800' }
const GRAY = {
  card: 'border-stone-300',
  head: 'border-stone-300 bg-stone-100 text-stone-700',
  tile: 'border-stone-300 bg-stone-100',
  badge: 'badge-none',
  text: 'text-stone-700',
  num: 'text-stone-800',
  soft: 'bg-stone-100 text-stone-800',
}

// Soil moisture: the main status of a zone. `dot` is the solid color for chart points.
export const MOISTURE_STATUS = {
  too_dry: { label: 'Too Dry', icon: 'too-dry', dot: '#f59e0b', ...AMBER },
  optimal: { label: 'Optimal', icon: 'optimal', dot: '#16a34a', ...GREEN },
  too_wet: { label: 'Too Wet', icon: 'too-wet', dot: '#3b82f6', ...BLUE },
}

// A zone that has never had a reading.
export const NO_READINGS = { label: 'No readings yet', icon: 'minus-circle', dot: '#a8a29e', ...GRAY }

export const TEMP_STATUS = {
  too_cold: { label: 'Too Cold', icon: 'too-cold', dot: '#3b82f6', ...BLUE },
  optimal: { label: 'In range', icon: 'optimal', dot: '#16a34a', ...GREEN },
  too_hot: { label: 'Too Hot', icon: 'too-hot', dot: '#ef4444', ...RED },
}

// `flag` is the wording for a badge that stands alone, away from a "Humidity" heading.
export const HUMIDITY_STATUS = {
  too_low: { label: 'Too Low', flag: 'Humidity too low', icon: 'humidity-low', dot: '#f59e0b', ...AMBER },
  optimal: { label: 'In range', flag: 'Humidity in range', icon: 'optimal', dot: '#16a34a', ...GREEN },
  too_high: { label: 'Too High', flag: 'Humidity too high', icon: 'humidity-high', dot: '#3b82f6', ...BLUE },
}

export const FLAG = {
  unusual: { label: 'Unusual', icon: 'warning', ...ORANGE },
  stale: { label: (days) => `No reading for ${days} days`, icon: 'clock', ...ORANGE },
  inactive: { label: 'Inactive', icon: 'ban', badge: GRAY.badge },
  imported: { label: 'Imported', icon: 'download', badge: GRAY.badge },
  neutral: { badge: GRAY.badge },
  superAdmin: { label: 'Super Admin', icon: 'shield', badge: 'badge-role' },
  admin: { label: 'Admin', icon: 'user', badge: GREEN.badge },
}

export const ENVIRONMENT_LABEL = {
  indoor: 'Indoor',
  rooftop: 'Rooftop',
}

export const ENVIRONMENT_ICON = {
  indoor: 'indoor',
  rooftop: 'rooftop',
}
