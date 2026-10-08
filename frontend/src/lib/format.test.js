import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { describeEstimate } from './estimate.js'
import {
  dateInputValue,
  endOfDayIso,
  formatNumber,
  formatRelative,
  fromLocalInputValue,
  startOfDayIso,
  toLocalInputValue,
} from './format.js'

// Tests run in Asia/Manila (UTC+8), set in vite.config.js.
describe('format helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T04:00:00Z')) // noon in Manila
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats numbers to at most two decimals without trailing zeros', () => {
    expect(formatNumber(12.5)).toBe('12.5')
    expect(formatNumber(70)).toBe('70')
    expect(formatNumber(0.756)).toBe('0.76')
    expect(formatNumber('20.00')).toBe('20')
    expect(formatNumber(null)).toBe('')
  })

  it('describes times relative to now, past and future', () => {
    expect(formatRelative('2026-10-08T03:59:50Z')).toBe('just now')
    expect(formatRelative('2026-10-08T03:15:00Z')).toBe('45 minutes ago')
    expect(formatRelative('2026-10-08T01:00:00Z')).toBe('3 hours ago')
    expect(formatRelative('2026-10-05T04:00:00Z')).toBe('3 days ago')
    expect(formatRelative('2026-10-11T04:00:00Z')).toBe('in 3 days')
  })

  it('turns a picked date into the exact start and end of that local day', () => {
    // Midnight in Manila is 16:00 UTC the day before.
    expect(startOfDayIso('2026-10-08')).toBe('2026-10-07T16:00:00.000Z')
    expect(endOfDayIso('2026-10-08')).toBe('2026-10-08T15:59:59.999Z')
  })

  it('converts between an API time and a datetime-local value', () => {
    expect(toLocalInputValue('2026-10-08T06:16:00.000000Z')).toBe('2026-10-08T14:16')
    expect(fromLocalInputValue('2026-10-08T14:16')).toBe('2026-10-08T06:16:00.000Z')
    expect(toLocalInputValue()).toBe('2026-10-08T12:00')
  })

  it('gives date input values counted back from today', () => {
    expect(dateInputValue()).toBe('2026-10-08')
    expect(dateInputValue(30)).toBe('2026-09-08')
  })

  it('puts the next-watering estimate into words', () => {
    const estimated = describeEstimate({ state: 'estimated', drying_rate_per_day: 4, due_at: '2026-10-11T04:00:00Z', intervals: 3 })
    expect(estimated.short).toBe('Next watering in 3 days')
    expect(estimated.detail).toContain('about 4 points per day')

    expect(describeEstimate({ state: 'due_now', drying_rate_per_day: null, due_at: null }).short).toBe('Likely needs water now')

    const unknown = describeEstimate({ state: 'not_enough_data', drying_rate_per_day: null, due_at: null })
    expect(unknown.short).toBeNull()
    expect(unknown.detail).toContain('Not enough recent readings')

    expect(describeEstimate(undefined)).toBeNull()
  })
})
