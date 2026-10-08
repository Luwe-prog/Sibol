// Labels and colors for the statuses stored on each reading.
// Class names are written out in full so Tailwind can find them.

export const MOISTURE_STATUS = {
  too_dry: {
    label: 'Too Dry',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800',
    panel: 'border-amber-300 bg-amber-50',
    heading: 'text-amber-800',
  },
  optimal: {
    label: 'Optimal',
    dot: 'bg-green-600',
    badge: 'bg-green-100 text-green-800',
    panel: 'border-green-300 bg-green-50',
    heading: 'text-green-800',
  },
  too_wet: {
    label: 'Too Wet',
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-800',
    panel: 'border-sky-300 bg-sky-50',
    heading: 'text-sky-800',
  },
}

export const TEMP_STATUS = {
  too_cold: { label: 'Too Cold', badge: 'bg-sky-100 text-sky-800' },
  optimal: { label: 'Optimal', badge: 'bg-green-100 text-green-800' },
  too_hot: { label: 'Too Hot', badge: 'bg-red-100 text-red-800' },
}

export const HUMIDITY_STATUS = {
  too_low: { label: 'Too Low', badge: 'bg-amber-100 text-amber-800' },
  optimal: { label: 'Optimal', badge: 'bg-green-100 text-green-800' },
  too_high: { label: 'Too High', badge: 'bg-sky-100 text-sky-800' },
}

export const ENVIRONMENT_LABEL = {
  indoor: 'Indoor',
  rooftop: 'Rooftop',
}
