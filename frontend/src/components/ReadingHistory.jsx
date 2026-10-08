import { useState } from 'react'
import { Link } from 'react-router-dom'
import useFetch from '../hooks/useFetch.js'
import { endOfDayIso, formatDateTime, formatNumber, startOfDayIso } from '../lib/format.js'
import { FLAG, HUMIDITY_STATUS, MOISTURE_STATUS, TEMP_STATUS } from '../lib/status.js'
import { btnSmall, linkClass } from '../lib/styles.js'
import FormField from './FormField.jsx'
import { AppIcon } from './icons.jsx'
import { EmptyState, ErrorAlert, Loading, Pagination, StatusBadge } from './ui.jsx'

const EMPTY_FILTERS = { from: '', to: '', status: '', zone_id: '' }

const th = 'px-3 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 first:pl-4'
const td = 'border-t border-stone-200 px-3 py-2.5 align-top text-stone-900 first:pl-4'

// A value with its status word and icon under it. Shown only when the value is out of range,
// except for soil moisture, which always shows its status.
function Measured({ value, status, always = false }) {
  return (
    <>
      <span className="text-[15px] font-semibold tabular-nums">{value}</span>
      {(always || status.label !== 'In range') && (
        <span className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${status.text}`}>
          <AppIcon name={status.icon} className="h-[13px] w-[13px]" />
          {status.label}
        </span>
      )}
    </>
  )
}

// Never a blank cell and never 0: a missing entry is not the same as "no water".
function Applied({ reading }) {
  return reading.water_applied_liters === null ? (
    <span className="italic text-stone-600">Not recorded</span>
  ) : (
    <span className="tabular-nums">{formatNumber(reading.water_applied_liters)} L</span>
  )
}

function Flags({ reading }) {
  if (!reading.is_suspicious && reading.source !== 'csv') return null
  return (
    <span className="mt-1 flex flex-wrap gap-1.5">
      {reading.is_suspicious && (
        <span title={reading.suspicious_reason}>
          <StatusBadge status={FLAG.unusual} />
        </span>
      )}
      {reading.source === 'csv' && <StatusBadge status={FLAG.imported} />}
    </span>
  )
}

// A filterable, paged list of readings: a table on a laptop, stacked cards on a phone.
// `url` is a zone's or a farm's readings endpoint. Pass `zones` (a farm's zones) to add
// a zone filter and show which zone each reading belongs to.
export default function ReadingHistory({ url, zones }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const showZone = Boolean(zones)

  const params = new URLSearchParams({ page })
  if (filters.from) params.set('from', startOfDayIso(filters.from))
  if (filters.to) params.set('to', endOfDayIso(filters.to))
  if (filters.status) params.set('status', filters.status)
  if (filters.zone_id) params.set('zone_id', filters.zone_id)

  const { data, error, loading, reload } = useFetch(`${url}?${params}`)

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
    setPage(1)
  }

  const isFiltered = Object.values(filters).some(Boolean)
  const readings = data?.readings ?? []

  return (
    <div>
      <div
        className={
          showZone
            ? 'mb-4 grid grid-cols-2 items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-[1.2fr_1fr_1fr_1.2fr_auto]'
            : 'mb-4 grid grid-cols-2 items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-[1fr_1fr_1.2fr_auto]'
        }
      >
        {showZone && (
          <div className="col-span-2 md:col-span-1">
            <FormField label="Zone" id="history_zone" as="select" value={filters.zone_id} onChange={(event) => setFilter('zone_id', event.target.value)}>
              <option value="">All zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </FormField>
          </div>
        )}
        <FormField
          label="From"
          id="history_from"
          type="date"
          max={filters.to || undefined}
          value={filters.from}
          onChange={(event) => setFilter('from', event.target.value)}
        />
        <FormField
          label="To"
          id="history_to"
          type="date"
          min={filters.from || undefined}
          value={filters.to}
          onChange={(event) => setFilter('to', event.target.value)}
        />
        <div className="col-span-2 md:col-span-1">
          <FormField label="Status" id="history_status" as="select" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
            <option value="">All statuses</option>
            <option value="too_dry">Too Dry</option>
            <option value="optimal">Optimal</option>
            <option value="too_wet">Too Wet</option>
          </FormField>
        </div>
        <button
          type="button"
          className={`col-span-2 h-12 md:col-span-1 ${btnSmall}`}
          disabled={!isFiltered}
          onClick={() => {
            setFilters(EMPTY_FILTERS)
            setPage(1)
          }}
        >
          Clear
        </button>
      </div>

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && readings.length === 0 && (
        <EmptyState icon="droplet" title={isFiltered ? 'No readings match these filters' : 'No readings yet'}>
          {isFiltered ? 'Try a wider date range or a different status.' : 'Readings appear here once they are entered.'}
        </EmptyState>
      )}

      {readings.length > 0 && (
        <>
          {/* Laptop: table. */}
          <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th scope="col" className={th}>Recorded</th>
                    {showZone && <th scope="col" className={th}>Zone</th>}
                    <th scope="col" className={th}>Soil</th>
                    <th scope="col" className={th}>Temp.</th>
                    <th scope="col" className={th}>Humidity</th>
                    <th scope="col" className={`${th} text-right`}>Recommended</th>
                    <th scope="col" className={`${th} text-right`}>Applied</th>
                    <th scope="col" className={th}>Entered by</th>
                    <th scope="col" className={th}>
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading) => (
                    <tr key={reading.id} className="hover:bg-stone-50">
                      <td className={`${td} whitespace-nowrap`}>
                        {formatDateTime(reading.recorded_at)}
                        <Flags reading={reading} />
                      </td>
                      {showZone && (
                        <td className={td}>
                          <Link to={`/zones/${reading.zone_id}`} className={linkClass}>
                            {reading.zone?.name}
                          </Link>
                        </td>
                      )}
                      <td className={td}>
                        <Measured value={`${formatNumber(reading.soil_moisture)}%`} status={MOISTURE_STATUS[reading.moisture_status]} always />
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        <Measured value={`${formatNumber(reading.temperature)} °C`} status={TEMP_STATUS[reading.temp_status]} />
                      </td>
                      <td className={td}>
                        <Measured value={`${formatNumber(reading.humidity)}%`} status={HUMIDITY_STATUS[reading.humidity_status]} />
                      </td>
                      <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{formatNumber(reading.recommended_liters)} L</td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <Applied reading={reading} />
                      </td>
                      <td className={`${td} text-stone-700`}>{reading.entered_by_user?.name}</td>
                      <td className={`${td} pr-4 text-right`}>
                        <Link to={`/readings/${reading.id}`} className={linkClass}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phone: the same rows as stacked cards. */}
          <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white md:hidden">
            {readings.map((reading) => (
              <li key={reading.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-stone-900">{formatDateTime(reading.recorded_at)}</p>
                    <p className="text-sm text-stone-600">
                      {showZone && `${reading.zone?.name} · `}
                      {reading.entered_by_user ? `by ${reading.entered_by_user.name}` : ''}
                    </p>
                    <Flags reading={reading} />
                  </div>
                  <Link to={`/readings/${reading.id}`} className={`inline-flex min-h-[44px] items-center ${linkClass}`}>
                    View
                  </Link>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-stone-600">Soil</dt>
                    <dd className="mt-0.5">
                      <Measured value={`${formatNumber(reading.soil_moisture)}%`} status={MOISTURE_STATUS[reading.moisture_status]} always />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-600">Temp.</dt>
                    <dd className="mt-0.5">
                      <Measured value={`${formatNumber(reading.temperature)} °C`} status={TEMP_STATUS[reading.temp_status]} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-600">Humidity</dt>
                    <dd className="mt-0.5">
                      <Measured value={`${formatNumber(reading.humidity)}%`} status={HUMIDITY_STATUS[reading.humidity_status]} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-600">Recommended</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{formatNumber(reading.recommended_liters)} L</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-stone-600">Applied</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold">
                      <Applied reading={reading} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <Pagination meta={data.meta} noun="reading" onPage={setPage} />
        </>
      )}
    </div>
  )
}
