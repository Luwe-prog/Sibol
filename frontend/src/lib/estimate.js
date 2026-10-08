import { formatDateTime, formatNumber, formatRelative } from './format.js'

// Turns the API's next-watering estimate into words.
// `short` is for a dashboard card; `detail` adds the reasoning for the zone page.
export const describeEstimate = (estimate) => {
  if (!estimate) return null

  const rate = `Soil is drying about ${formatNumber(estimate.drying_rate_per_day)} points per day.`

  switch (estimate.state) {
    case 'estimated':
      return {
        due: true,
        short: `Next watering ${formatRelative(estimate.due_at)}`,
        detail: `Estimated to need water ${formatRelative(estimate.due_at)}, around ${formatDateTime(estimate.due_at)}. ${rate}`,
      }
    case 'due_now':
      return {
        due: true,
        short: 'Likely needs water now',
        detail: estimate.drying_rate_per_day
          ? `Estimated to have dried below the ideal range by now. ${rate} Take a reading to confirm.`
          : 'The last reading was already below the ideal range.',
      }
    default:
      return {
        due: false,
        short: null,
        detail:
          'Not enough recent readings to estimate the next watering. It needs at least two stretches of drying in the last 14 days, from readings no more than 4 days apart.',
      }
  }
}
