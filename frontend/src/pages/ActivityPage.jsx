import { useState } from 'react'
import FormField from '../components/FormField.jsx'
import { AppIcon } from '../components/icons.jsx'
import { EmptyState, ErrorAlert, Loading, PageHeader, Pagination } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'

// The first part of an action name ("crop" in "crop.updated"), with its label and icon.
const AREAS = {
  account: { label: 'Accounts', icon: 'users' },
  farm: { label: 'Farms', icon: 'leaf' },
  crop: { label: 'Crop library', icon: 'sprout' },
  zone: { label: 'Zones', icon: 'plus' },
  reading: { label: 'Readings', icon: 'pencil' },
}

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
  // Numbers stored as "100.00" read better as 100.
  if (typeof value === 'string' && /^-?\d+\.\d+$/.test(value)) return String(Number(value))
  return String(value)
}

const dayFormat = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' })

// Who changed what, newest first, grouped by day. Super Admins only.
export default function ActivityPage() {
  const [area, setArea] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({ page })
  if (area) params.set('area', area)

  const { data, error, loading, reload } = useFetch(`/super-admin/activity?${params}`)

  const entries = data?.entries ?? []

  // Entries arrive newest first, so each new day starts a new group.
  const days = []
  entries.forEach((entry) => {
    const day = dayFormat.format(new Date(entry.created_at))
    if (days[days.length - 1]?.day !== day) days.push({ day, entries: [] })
    days[days.length - 1].entries.push(entry)
  })

  return (
    <>
      <PageHeader title="Activity log" subtitle="A record of changes to accounts, farms, crops, zones and readings." />

      <div className="activity-filter">
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
          {Object.entries(AREAS).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </FormField>
      </div>

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && entries.length === 0 && (
        <EmptyState icon="history" title="No activity yet">
          Changes will appear here when you add or update accounts, farms, zones, crops or readings.
        </EmptyState>
      )}

      <div className="activity-days">
        {days.map((group) => (
          <section key={group.day}>
            <h2 className="activity-date">{group.day}</h2>
            <div className="card activity-card">
              {group.entries.map((entry) => {
                const kind = AREAS[entry.action.split('.')[0]] ?? { label: 'Other', icon: 'history' }
                return (
                  <div className="activity-entry" key={entry.id}>
                    <span className="soft-icon">
                      <AppIcon name={kind.icon} />
                    </span>
                    <div className="activity-copy">
                      <h3>{entry.description}</h3>
                      <p className="muted">
                        {entry.user ? entry.user.name : 'Command line'}
                        <span className="dot-separator">·</span>
                        {timeFormat.format(new Date(entry.created_at))}
                      </p>
                      <Changes changes={entry.changes} />
                    </div>
                    <span className="activity-category">{kind.label}</span>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {entries.length > 0 && <Pagination meta={data.meta} noun="entry" plural="entries" onPage={setPage} />}
    </>
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
    <div className="change-list">
      {edited.map((field) => (
        <div className="change-values" key={field}>
          <span>{label(field)}</span>
          {field in before && (
            <>
              <span className="old-value">{show(before[field])}</span>
              <AppIcon name="arrow-right" />
            </>
          )}
          <strong>{show(after[field])}</strong>
        </div>
      ))}
      {others.map((field) => (
        <div className="change-values" key={field}>
          <span>{label(field)}</span>
          <strong>{show(other[field])}</strong>
        </div>
      ))}
    </div>
  )
}
