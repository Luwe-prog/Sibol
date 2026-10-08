import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { Badge, ErrorAlert, Loading } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { describeEstimate } from '../lib/estimate.js'
import { formatDateTime, formatNumber } from '../lib/format.js'
import { ENVIRONMENT_LABEL, HUMIDITY_STATUS, MOISTURE_STATUS, TEMP_STATUS } from '../lib/status.js'
import { btnDanger, btnPrimary, btnSecondary, linkClass } from '../lib/styles.js'

// The instant result shown right after a reading is saved; also the detail view of any past reading.
export default function ReadingResultPage() {
  const { readingId } = useParams()
  const { data, error, loading, reload } = useFetch(`/readings/${readingId}`)

  if (loading) return <Loading />
  if (error) return <ErrorAlert>{error}</ErrorAlert>

  return <ReadingResult key={data.reading.id} reading={data.reading} onChanged={reload} />
}

function ReadingResult({ reading, onChanged }) {
  const navigate = useNavigate()
  const zone = reading.zone
  const status = MOISTURE_STATUS[reading.moisture_status]
  const canEnter = zone.is_active && zone.farm.is_active
  const estimate = describeEstimate(zone.watering_estimate)

  const [waterApplied, setWaterApplied] = useState(reading.water_applied_liters ?? '')
  const [waterError, setWaterError] = useState('')
  const [waterSaved, setWaterSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const saveWaterApplied = async (event) => {
    event.preventDefault()
    setSaving(true)
    setWaterError('')
    try {
      await api.put(`/readings/${reading.id}`, {
        water_applied_liters: waterApplied === '' ? null : waterApplied,
      })
      setWaterSaved(true)
      onChanged()
    } catch (err) {
      const { message, fields } = readError(err)
      setWaterError(fields.water_applied_liters ?? message)
    } finally {
      setSaving(false)
    }
  }

  const deleteReading = async () => {
    if (!window.confirm('Delete this reading? It will be removed from the history and reports.')) return
    try {
      await api.delete(`/readings/${reading.id}`)
      navigate(`/zones/${zone.id}`, { replace: true })
    } catch (err) {
      setError(readError(err).message)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-2 text-sm">
        <Link to={`/zones/${zone.id}`} className={linkClass}>
          ← {zone.name}
        </Link>
      </p>

      <ErrorAlert>{error}</ErrorAlert>

      <div className={`rounded-xl border p-5 ${status.panel}`}>
        <p className="text-sm text-stone-600">
          {zone.farm.name} · {zone.name} · {zone.crop.name} · {ENVIRONMENT_LABEL[zone.environment]}
        </p>
        <p className={`mt-1 text-3xl font-semibold ${status.heading}`}>{status.label}</p>

        {reading.moisture_status === 'too_dry' && (
          <p className="mt-3 text-stone-900">
            <span className="text-4xl font-semibold">{formatNumber(reading.recommended_liters)}</span>{' '}
            <span className="text-lg">liters to apply</span>
          </p>
        )}

        <p className="mt-3 text-stone-800">{reading.recommendation_text}</p>
      </div>

      {reading.moisture_status !== 'too_dry' && estimate?.short && (
        <p className="mt-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
          <span className="font-medium text-stone-900">{estimate.short}.</span> An estimate for this zone from its recent
          readings.
        </p>
      )}

      {reading.is_suspicious && (
        <p className="mt-3 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-900">
          Marked as unusual: {reading.suspicious_reason}
        </p>
      )}

      <dl className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white text-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-stone-600">Soil moisture</dt>
          <dd className="flex items-center gap-2 font-medium text-stone-900">
            {formatNumber(reading.soil_moisture)}%<Badge className={status.badge}>{status.label}</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-stone-600">Temperature</dt>
          <dd className="flex items-center gap-2 font-medium text-stone-900">
            {formatNumber(reading.temperature)} °C
            <Badge className={TEMP_STATUS[reading.temp_status].badge}>{TEMP_STATUS[reading.temp_status].label}</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-stone-600">Humidity</dt>
          <dd className="flex items-center gap-2 font-medium text-stone-900">
            {formatNumber(reading.humidity)}%
            <Badge className={HUMIDITY_STATUS[reading.humidity_status].badge}>
              {HUMIDITY_STATUS[reading.humidity_status].label}
            </Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-stone-600">Recorded</dt>
          <dd className="text-right font-medium text-stone-900">
            {formatDateTime(reading.recorded_at)}
            {reading.entered_by_user && <span className="block font-normal text-stone-500">by {reading.entered_by_user.name}</span>}
          </dd>
        </div>
        {reading.notes && (
          <div className="px-4 py-3">
            <dt className="text-stone-600">Notes</dt>
            <dd className="mt-1 whitespace-pre-line text-stone-900">{reading.notes}</dd>
          </div>
        )}
      </dl>

      <form onSubmit={saveWaterApplied} className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
        <FormField
          label="Water actually applied (liters)"
          id="water_applied"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="Leave blank if not yet watered"
          value={waterApplied}
          onChange={(event) => {
            setWaterApplied(event.target.value)
            setWaterSaved(false)
          }}
          error={waterError}
          hint={waterSaved ? 'Saved.' : 'Used in the water report to compare recommended and applied water.'}
        />
        <button type="submit" className={`mt-3 ${btnSecondary}`} disabled={saving}>
          {saving ? 'Saving…' : 'Save water applied'}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {canEnter && (
          <Link to={`/zones/${zone.id}/readings/new`} className={btnPrimary}>
            Enter another reading
          </Link>
        )}
        <Link to={`/readings/${reading.id}/edit`} className={btnSecondary}>
          Edit
        </Link>
        <button type="button" className={btnDanger} onClick={deleteReading}>
          Delete
        </button>
      </div>
    </div>
  )
}
