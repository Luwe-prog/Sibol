import { useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import useFetch from '../hooks/useFetch.js'
import { formatDateTime, formatNumber, formatShortDate } from '../lib/format.js'
import { HUMIDITY_STATUS, MOISTURE_STATUS, TEMP_STATUS } from '../lib/status.js'
import { ErrorAlert } from './ui.jsx'

const RANGES = [7, 30, 90]

// Chart colors are hex because Recharts takes them as SVG attributes, not class names.
const LINE_COLOR = '#2a78d6'
const BAND_COLOR = '#0ca30c'
const GRID_COLOR = '#e7e5e4'
const AXIS_TEXT = { fill: '#78716c', fontSize: 12 }

const rangeButtonClass = (selected) =>
  selected
    ? 'rounded-lg bg-green-700 px-3 py-1.5 text-sm font-medium text-white'
    : 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100'

// Midnight (device time) the given number of days before today, as an ISO instant.
const startOfDaysAgo = (days) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

const MEASURES = [
  { key: 'soil', title: 'Soil moisture', unit: '%', valueKey: 'soil_moisture', statusKey: 'moisture_status', statuses: MOISTURE_STATUS, minKey: 'soil_moisture_min', maxKey: 'soil_moisture_max' },
  { key: 'temp', title: 'Temperature', unit: ' °C', valueKey: 'temperature', statusKey: 'temp_status', statuses: TEMP_STATUS, minKey: 'temp_min', maxKey: 'temp_max' },
  { key: 'humidity', title: 'Humidity', unit: '%', valueKey: 'humidity', statusKey: 'humidity_status', statuses: HUMIDITY_STATUS, minKey: 'humidity_min', maxKey: 'humidity_max' },
]

// One chart per measure, each on its own scale, with the crop's ideal range shaded.
export default function TrendCharts({ zoneId, crop }) {
  const [range, setRange] = useState(() => ({ days: 30, from: startOfDaysAgo(30) }))
  const { days, from } = range
  const setDays = (value) => setRange({ days: value, from: startOfDaysAgo(value) })

  const { data, error, loading } = useFetch(`/zones/${zoneId}/trend?from=${encodeURIComponent(from)}`)

  // Each point carries the ideal range it was judged against. Readings saved before
  // ranges were stored per reading fall back to the crop's current ones.
  const points = useMemo(
    () =>
      (data?.points ?? []).map((point) => {
        const ranges = point.thresholds ?? crop
        const prepared = { ...point, time: new Date(point.recorded_at).getTime() }
        MEASURES.forEach((measure) => {
          prepared[`${measure.key}_band`] = [ranges[measure.minKey], ranges[measure.maxKey]]
        })
        return prepared
      }),
    [data, crop],
  )

  // Fit the temperature axis to the data and the ideal ranges, whichever is wider.
  const temperatures = points.flatMap((point) => [point.temperature, ...point.temp_band])
  const tempDomain = [
    Math.floor(Math.min(crop.temp_min, ...temperatures) - 3),
    Math.ceil(Math.max(crop.temp_max, ...temperatures) + 3),
  ]

  const chartProps = { points, loading, days, crop }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-900">Trends</h2>
        <div className="flex gap-2" role="group" aria-label="Time range">
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={days === option}
              className={rangeButtonClass(days === option)}
              onClick={() => setDays(option)}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      <ErrorAlert>{error}</ErrorAlert>

      {!error && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <MeasureChart measure={MEASURES[0]} domain={[0, 100]} height={260} {...chartProps} />
          </div>
          <MeasureChart measure={MEASURES[1]} domain={tempDomain} height={200} {...chartProps} />
          <MeasureChart measure={MEASURES[2]} domain={[0, 100]} height={200} {...chartProps} />
        </div>
      )}

      <p className="mt-2 text-sm text-stone-500">
        The shaded band is the ideal range each reading was judged against. Every point is also listed in the history
        table below.
      </p>
    </section>
  )
}

function MeasureChart({ measure, domain, points, loading, days, height, crop }) {
  const { title, unit, valueKey, statusKey, statuses, minKey, maxKey } = measure
  const bandKey = `${measure.key}_band`

  // When the range never changed, a plain band across the whole chart reads best.
  // When it did change, the band steps at the reading where the new range took effect.
  const first = points[0]?.[bandKey]
  const steady = points.every((point) => point[bandKey][0] === first[0] && point[bandKey][1] === first[1])
  const currentMin = crop[minKey]
  const currentMax = crop[maxKey]

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="font-medium text-stone-900">{title}</p>
      <p className="mb-2 flex items-center gap-2 text-sm text-stone-500">
        <span className="inline-block h-3 w-3 rounded-sm border border-green-600/40 bg-green-600/20" aria-hidden="true" />
        {steady ? 'Ideal' : 'Ideal range changed in this period. Now'} {formatNumber(currentMin)}–{formatNumber(currentMax)}
        {unit}
      </p>

      {points.length === 0 ? (
        <p className="flex items-center justify-center text-sm text-stone-500" style={{ height }}>
          {loading ? 'Loading…' : `No readings in the last ${days} days.`}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            {steady ? (
              <ReferenceArea y1={first[0]} y2={first[1]} fill={BAND_COLOR} fillOpacity={0.12} stroke="none" ifOverflow="hidden" />
            ) : (
              <Area
                type="stepAfter"
                dataKey={bandKey}
                fill={BAND_COLOR}
                fillOpacity={0.12}
                stroke="none"
                activeDot={false}
                isAnimationActive={false}
              />
            )}
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatShortDate}
              tick={AXIS_TEXT}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              tick={AXIS_TEXT}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value) => `${value}${unit.trim() === '%' ? '%' : '°'}`}
            />
            <Tooltip
              cursor={{ stroke: '#a8a29e', strokeDasharray: '3 3' }}
              content={<PointTooltip title={title} unit={unit} valueKey={valueKey} statusKey={statusKey} statuses={statuses} bandKey={bandKey} />}
            />
            <Line
              type="monotone"
              dataKey={valueKey}
              stroke={LINE_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: LINE_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: LINE_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function PointTooltip({ active, payload, title, unit, valueKey, statusKey, statuses, bandKey }) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload

  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="text-stone-500">{formatDateTime(point.recorded_at)}</p>
      <p className="font-medium text-stone-900">
        {title}: {formatNumber(point[valueKey])}
        {unit}
      </p>
      <p className="text-stone-600">
        {statuses[point[statusKey]].label} · ideal {formatNumber(point[bandKey][0])}–{formatNumber(point[bandKey][1])}
        {unit}
      </p>
    </div>
  )
}
