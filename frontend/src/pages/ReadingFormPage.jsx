import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { ErrorAlert, Loading } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatNumber, fromLocalInputValue, toLocalInputValue } from '../lib/format.js'
import { ENVIRONMENT_LABEL } from '../lib/status.js'
import { btnPrimary, btnSecondary, linkClass } from '../lib/styles.js'

// Handles both /zones/:zoneId/readings/new and /readings/:readingId/edit.
export default function ReadingFormPage() {
  const { zoneId, readingId } = useParams()
  const zoneRequest = useFetch(zoneId ? `/zones/${zoneId}` : null)
  const readingRequest = useFetch(readingId ? `/readings/${readingId}` : null)

  const request = readingId ? readingRequest : zoneRequest

  if (request.loading) return <Loading />
  if (request.error) return <ErrorAlert>{request.error}</ErrorAlert>

  const reading = readingRequest.data?.reading ?? null
  const zone = reading ? reading.zone : zoneRequest.data.zone

  return <ReadingForm zone={zone} reading={reading} />
}

function ReadingForm({ zone, reading }) {
  const navigate = useNavigate()
  const isNew = !reading
  const [form, setForm] = useState({
    soil_moisture: reading?.soil_moisture ?? '',
    temperature: reading?.temperature ?? '',
    humidity: reading?.humidity ?? '',
    recorded_at: toLocalInputValue(reading?.recorded_at),
    water_applied_liters: reading?.water_applied_liters ?? '',
    notes: reading?.notes ?? '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  // Reasons the server found the reading unusual; the Admin must confirm before it is saved.
  const [suspiciousReasons, setSuspiciousReasons] = useState(null)
  const [saving, setSaving] = useState(false)

  const crop = zone.crop
  const backTo = isNew ? `/zones/${zone.id}` : `/readings/${reading.id}`

  const set = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSuspiciousReasons(null)
  }

  const save = async (confirmSuspicious) => {
    setSaving(true)
    setError('')
    setFieldErrors({})

    const payload = {
      soil_moisture: form.soil_moisture,
      temperature: form.temperature,
      humidity: form.humidity,
      recorded_at: fromLocalInputValue(form.recorded_at),
      water_applied_liters: form.water_applied_liters === '' ? null : form.water_applied_liters,
      notes: form.notes === '' ? null : form.notes,
      confirm_suspicious: confirmSuspicious,
    }

    try {
      const response = isNew
        ? await api.post(`/zones/${zone.id}/readings`, payload)
        : await api.put(`/readings/${reading.id}`, payload)
      navigate(`/readings/${response.data.reading.id}`, { replace: true })
    } catch (err) {
      if (err.response?.data?.code === 'suspicious_reading') {
        setSuspiciousReasons(err.response.data.reasons)
      } else {
        const { message, fields } = readError(err)
        setFieldErrors(fields)
        setError(message)
      }
      setSaving(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    save(false)
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-2 text-sm">
        <Link to={backTo} className={linkClass}>
          ← Back
        </Link>
      </p>

      <h1 className="text-2xl font-semibold text-stone-900">{isNew ? 'Enter reading' : 'Edit reading'}</h1>
      <p className="mt-1 text-stone-600">
        {zone.name} · {crop.name} · {ENVIRONMENT_LABEL[zone.environment]}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <ErrorAlert>{error}</ErrorAlert>

        <FormField
          label="Soil moisture (%)"
          id="soil_moisture"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          max="100"
          required
          autoFocus
          value={form.soil_moisture}
          onChange={(event) => set('soil_moisture', event.target.value)}
          error={fieldErrors.soil_moisture}
          hint={`Ideal for ${crop.name}: ${formatNumber(crop.soil_moisture_min)}–${formatNumber(crop.soil_moisture_max)}%`}
        />
        <FormField
          label="Temperature (°C)"
          id="temperature"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          max="60"
          required
          value={form.temperature}
          onChange={(event) => set('temperature', event.target.value)}
          error={fieldErrors.temperature}
          hint={`Ideal: ${formatNumber(crop.temp_min)}–${formatNumber(crop.temp_max)} °C`}
        />
        <FormField
          label="Humidity (%)"
          id="humidity"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          max="100"
          required
          value={form.humidity}
          onChange={(event) => set('humidity', event.target.value)}
          error={fieldErrors.humidity}
          hint={`Ideal: ${formatNumber(crop.humidity_min)}–${formatNumber(crop.humidity_max)}%`}
        />
        <FormField
          label="Recorded at"
          id="recorded_at"
          type="datetime-local"
          required
          max={toLocalInputValue()}
          value={form.recorded_at}
          onChange={(event) => set('recorded_at', event.target.value)}
          error={fieldErrors.recorded_at}
          hint="Change this only if you took the reading earlier."
        />
        {!isNew && (
          <FormField
            label="Water applied (liters, optional)"
            id="water_applied_liters"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={form.water_applied_liters}
            onChange={(event) => set('water_applied_liters', event.target.value)}
            error={fieldErrors.water_applied_liters}
          />
        )}
        <FormField
          label="Notes (optional)"
          id="notes"
          as="textarea"
          rows={2}
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
          error={fieldErrors.notes}
        />

        {suspiciousReasons && (
          <div role="alert" className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
            <p className="font-medium">This reading looks unusual. Please check it.</p>
            <ul className="mt-1 list-disc pl-5">
              {suspiciousReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2">Correct the values above, or save it anyway if they are right. It will be marked as unusual.</p>
            <button type="button" className={`mt-3 ${btnSecondary}`} disabled={saving} onClick={() => save(true)}>
              Save anyway
            </button>
          </div>
        )}

        <button type="submit" className={`w-full ${btnPrimary}`} disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Save and see result' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
