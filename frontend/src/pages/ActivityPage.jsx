import { useState } from 'react'
import FormField from '../components/FormField.jsx'
import { EmptyState, ErrorAlert, Loading, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatDateTime } from '../lib/format.js'
import { btnSmall } from '../lib/styles.js'

const AREAS = [
  { value: 'account', label: 'Accounts' },
  { value: 'farm', label: 'Farms' },
  { value: 'crop', label: 'Crop library' },
  { value: 'zone', label: 'Zones' },
  { value: 'reading', label: 'Readings' },
]

// Column names as stored, in plain words.
const FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  role: 'Role',
  is_active: 'Active',
  location: 'Location',
  description: 'Description',
  source_reference: 'Source',
  soil_moisture_min: 'Soil moisture min',
  soil_moisture_max: 'Soil moisture max',
  temp_min: 'Temperature min',
  temp_max: 'Temperature max',
  humidity_min: 'Humidity min',
  humidity_max: 'Humidity max',
  crop_id: 'Crop (id)',
  environment: 'Environment',
  water_factor: 'Water factor',
  recorded_at: 'Recorded at',
  soil_moisture: 'Soil moisture',
  temperature: 'Temperature',
  humidity: 'Humidity',
  water_applied_liters: 'Water applied (L)',
  notes: 'Notes',
  moisture_status: 'Soil status',
  temp_status: 'Temperature status',
  humidity_status: 'Humidity status',
  recommended_liters: 'Recommended (L)',
  recommendation_text: 'Advice',
  is_suspicious: 'Unusual',
  suspicious_reason: 'Unusual reason',
  farms_added: 'Farms added (ids)',
  farms_removed: 'Farms removed (ids)',
  admins_added: 'Admins added (ids)',
  admins_removed: 'Admins removed (ids)',
  imported: 'Readings imported',
  flagged_unusual: 'Flagged unusual',
  crop: 'Crop',
}

const label = (field) => FIELD_LABELS[field] ?? field

const show = (value) => {
  if (value === null || value === undefined || value === '') return 'empty'
  if (Array.isArray(value)) return value.join(', ')
  if (value === true || value === 1) return 'yes'
  if (value === false || value === 0) return 'no'
  return String(value)
}

// Who changed what, newest first. Super Admins only.
export default function ActivityPage() {
  const [area, setArea] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({ page })
  if (area) params.set('area', area)

  const { data, error, loading } = useFetch(`/super-admin/activity?${params}`)

  const entries = data?.entries ?? []
  const meta = data?.meta

  return (
    <div>
      <PageHeader title="Activity log" subtitle="A record of changes to accounts, farms, crops, zones and readings." />

      <div className="mb-4 max-w-xs">
        <FormField
          label="Show"
          id="activity_area"
          as="select"
          value={area}
          onChange={(event) => {
            setArea(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Everything</option>
          {AREAS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormField>
      </div>

      <ErrorAlert>{error}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && entries.length === 0 && <EmptyState>Nothing has been recorded yet.</EmptyState>}

      {entries.length > 0 && (
        <>
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {entries.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <p className="text-stone-900">{entry.description}</p>
                <p className="text-sm text-stone-500">
                  {entry.user ? entry.user.name : 'Command line'} · {formatDateTime(entry.created_at)}
                </p>
                <Changes changes={entry.changes} />
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
            <p>
              {meta.total} {meta.total === 1 ? 'entry' : 'entries'}
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

function Changes({ changes }) {
  if (!changes) return null

  const { before = {}, after = {}, ...other } = changes
  // A new record has only "after"; an edit has both.
  const edited = Object.keys(after)
  const others = Object.keys(other)

  if (edited.length === 0 && others.length === 0) return null

  return (
    <ul className="mt-2 space-y-0.5 text-sm text-stone-700">
      {edited.map((field) => (
        <li key={field}>
          <span className="text-stone-500">{label(field)}:</span>{' '}
          {field in before ? (
            <>
              {show(before[field])} → <span className="font-medium text-stone-900">{show(after[field])}</span>
            </>
          ) : (
            <span className="font-medium text-stone-900">{show(after[field])}</span>
          )}
        </li>
      ))}
      {others.map((field) => (
        <li key={field}>
          <span className="text-stone-500">{label(field)}:</span> {show(other[field])}
        </li>
      ))}
    </ul>
  )
}
