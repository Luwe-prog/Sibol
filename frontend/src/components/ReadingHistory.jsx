import { useState } from 'react'
import { Link } from 'react-router-dom'
import useFetch from '../hooks/useFetch.js'
import { endOfDayIso, formatDateTime, formatNumber, startOfDayIso } from '../lib/format.js'
import { HUMIDITY_STATUS, MOISTURE_STATUS, TEMP_STATUS } from '../lib/status.js'
import { btnSecondary, btnSmall, linkClass } from '../lib/styles.js'
import FormField from './FormField.jsx'
import { Badge, EmptyState, ErrorAlert, Loading } from './ui.jsx'

const EMPTY_FILTERS = { from: '', to: '', status: '', zone_id: '' }

// A filterable, paged table of readings.
// `url` is a zone's or a farm's readings endpoint. Pass `zones` (a farm's zones) to add
// a zone filter and a Zone column.
export default function ReadingHistory({ url, zones }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const showZone = Boolean(zones)

  const params = new URLSearchParams({ page })
  if (filters.from) params.set('from', startOfDayIso(filters.from))
  if (filters.to) params.set('to', endOfDayIso(filters.to))
  if (filters.status) params.set('status', filters.status)
  if (filters.zone_id) params.set('zone_id', filters.zone_id)

  const { data, error, loading } = useFetch(`${url}?${params}`)

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
    setPage(1)
  }

  const isFiltered = Object.values(filters).some(Boolean)
  const readings = data?.readings ?? []
  const meta = data?.meta

  return (
    <div>
      <div
        className={
          showZone
            ? 'mb-4 grid grid-cols-2 items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-5'
            : 'mb-4 grid grid-cols-2 items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-4'
        }
      >
        {showZone && (
          <FormField
            label="Zone"
            id="history_zone"
            as="select"
            value={filters.zone_id}
            onChange={(event) => setFilter('zone_id', event.target.value)}
          >
            <option value="">All zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </FormField>
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
        <FormField
          label="Status"
          id="history_status"
          as="select"
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="too_dry">Too Dry</option>
          <option value="optimal">Optimal</option>
          <option value="too_wet">Too Wet</option>
        </FormField>
        <button
          type="button"
          className={btnSecondary}
          disabled={!isFiltered}
          onClick={() => {
            setFilters(EMPTY_FILTERS)
            setPage(1)
          }}
        >
          Clear filters
        </button>
      </div>

      <ErrorAlert>{error}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && readings.length === 0 && (
        <EmptyState>{isFiltered ? 'No readings match these filters.' : 'No readings yet.'}</EmptyState>
      )}

      {readings.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Recorded</th>
                  {showZone && <th className="whitespace-nowrap px-3 py-2 font-medium">Zone</th>}
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Soil</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Temp</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Humidity</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Recommended</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Applied</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Entered by</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {readings.map((reading) => (
                  <tr key={reading.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-stone-800">
                      {formatDateTime(reading.recorded_at)}
                      {reading.is_suspicious && (
                        <span className="ml-2" title={reading.suspicious_reason}>
                          <Badge className="bg-orange-100 text-orange-800">Unusual</Badge>
                        </span>
                      )}
                      {reading.source === 'csv' && (
                        <span className="ml-2">
                          <Badge className="bg-stone-100 text-stone-600">Imported</Badge>
                        </span>
                      )}
                    </td>
                    {showZone && (
                      <td className="whitespace-nowrap px-3 py-2">
                        <Link to={`/zones/${reading.zone_id}`} className={linkClass}>
                          {reading.zone?.name}
                        </Link>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatNumber(reading.soil_moisture)}%{' '}
                      <Badge className={MOISTURE_STATUS[reading.moisture_status].badge}>
                        {MOISTURE_STATUS[reading.moisture_status].label}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatNumber(reading.temperature)} °C{' '}
                      {reading.temp_status !== 'optimal' && (
                        <Badge className={TEMP_STATUS[reading.temp_status].badge}>{TEMP_STATUS[reading.temp_status].label}</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatNumber(reading.humidity)}%{' '}
                      {reading.humidity_status !== 'optimal' && (
                        <Badge className={HUMIDITY_STATUS[reading.humidity_status].badge}>
                          {HUMIDITY_STATUS[reading.humidity_status].label}
                        </Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{formatNumber(reading.recommended_liters)} L</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {reading.water_applied_liters === null ? (
                        <span className="text-stone-400">not recorded</span>
                      ) : (
                        `${formatNumber(reading.water_applied_liters)} L`
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-stone-600">{reading.entered_by_user?.name}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <Link to={`/readings/${reading.id}`} className={linkClass}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
            <p>
              {meta.total} {meta.total === 1 ? 'reading' : 'readings'}
              {meta.last_page > 1 && ` · page ${meta.current_page} of ${meta.last_page}`}
            </p>
            {meta.last_page > 1 && (
              <div className="flex gap-2">
                <button type="button" className={btnSmall} disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}>
                  Newer
                </button>
                <button
                  type="button"
                  className={btnSmall}
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage(page + 1)}
                >
                  Older
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
