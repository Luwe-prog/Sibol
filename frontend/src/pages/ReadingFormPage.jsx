import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { AppIcon } from '../components/icons.jsx'
import { ErrorAlert, Loading, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatNumber, fromLocalInputValue, toLocalInputValue } from '../lib/format.js'
import { ENVIRONMENT_LABEL } from '../lib/status.js'
import { btnPrimary, btnSecondary } from '../lib/styles.js'

// Handles both /zones/:zoneId/readings/new and /readings/:readingId/edit.
export default function ReadingFormPage() {
  const { zoneId, readingId } = useParams()
  const zoneRequest = useFetch(zoneId ? `/zones/${zoneId}` : null)
  const readingRequest = useFetch(readingId ? `/readings/${readingId}` : null)

  const request = readingId ? readingRequest : zoneRequest

  if (request.loading) return <Loading />
  if (request.error) return <ErrorAlert onRetry={request.reload}>{request.error}</ErrorAlert>

  const reading = readingRequest.data?.reading ?? null
  const zone = reading ? reading.zone : zoneRequest.data.zone

  return <ReadingForm zone={zone} reading={reading} />
}

const bigInput =
  'h-[60px] w-full rounded-xl border bg-white pl-4 pr-16 text-2xl font-semibold tabular-nums text-stone-900 ' +
  'focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700 lg:h-14 lg:text-[22px]'

// One measurement: a card with a big number field, the unit inside it, and the crop's ideal range under it.
function MeasureField({ id, label, icon, unit, max, value, onChange, error, hint, autoFocus }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 pb-4 pt-3.5">
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-stone-800">
        <AppIcon name={icon} className="h-5 w-5 text-green-800" />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          autoComplete="off"
          step="0.1"
          min="0"
          max={max}
          required
          autoFocus={autoFocus}
          value={value}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint`}
          className={`${bigInput} ${error ? 'border-red-700' : 'border-stone-500'}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg font-semibold text-stone-600">{unit}</span>
      </div>
      <p id={`${id}-hint`} className="mt-2 flex items-center gap-1.5 text-sm text-stone-700">
        <span className="h-2 w-3 shrink-0 rounded-sm border border-dashed border-green-400 bg-green-100" aria-hidden="true" />
        {hint}
      </p>
      {error && (
        <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700">
          <AppIcon name="alert-circle" className="mt-0.5 h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  )
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
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={isNew ? 'Enter reading' : 'Edit reading'}
        subtitle={`${zone.name} · ${crop.name} · ${ENVIRONMENT_LABEL[zone.environment]}`}
        back={isNew ? { to: `/zones/${zone.id}`, label: zone.name } : { to: `/readings/${reading.id}`, label: 'Back to the reading' }}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert>{error}</ErrorAlert>

        <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          <MeasureField
            id="soil_moisture"
            label="Soil moisture"
            icon="droplet"
            unit="%"
            max="100"
            autoFocus
            value={form.soil_moisture}
            onChange={(event) => set('soil_moisture', event.target.value)}
            error={fieldErrors.soil_moisture}
            hint={`Ideal for ${crop.name}: ${formatNumber(crop.soil_moisture_min)}–${formatNumber(crop.soil_moisture_max)}%`}
          />
          <MeasureField
            id="temperature"
            label="Temperature"
            icon="thermometer"
            unit="°C"
            max="60"
            value={form.temperature}
            onChange={(event) => set('temperature', event.target.value)}
            error={fieldErrors.temperature}
            hint={`Ideal: ${formatNumber(crop.temp_min)}–${formatNumber(crop.temp_max)} °C`}
          />
          <MeasureField
            id="humidity"
            label="Humidity"
            icon="wind"
            unit="%"
            max="100"
            value={form.humidity}
            onChange={(event) => set('humidity', event.target.value)}
            error={fieldErrors.humidity}
            hint={`Ideal: ${formatNumber(crop.humidity_min)}–${formatNumber(crop.humidity_max)}%`}
          />
        </div>

        <div className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
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
                label="Water applied"
                id="water_applied_liters"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                unit="L"
                optional
                value={form.water_applied_liters}
                onChange={(event) => set('water_applied_liters', event.target.value)}
                error={fieldErrors.water_applied_liters}
              />
            )}
          </div>
          <FormField
            label="Notes"
            id="notes"
            as="textarea"
            optional
            value={form.notes}
            onChange={(event) => set('notes', event.target.value)}
            error={fieldErrors.notes}
          />
        </div>

        {suspiciousReasons && (
          <div role="alert" className="rounded-2xl border border-orange-300 bg-orange-50 p-4 text-orange-800">
            <p className="flex items-center gap-2 text-base font-semibold">
              <AppIcon name="warning" />
              This reading looks unusual. Please check it.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] text-orange-900">
              {suspiciousReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2 text-[15px] text-orange-900">
              Correct the values above, or save it anyway if they are right. It will be marked as unusual.
            </p>
          </div>
        )}

        {suspiciousReasons ? (
          <div className="grid grid-cols-[1fr_1.3fr] gap-2">
            <button type="button" className={`h-14 ${btnSecondary}`} onClick={() => setSuspiciousReasons(null)}>
              Edit values
            </button>
            <button type="button" className={`h-14 text-lg ${btnPrimary}`} disabled={saving} onClick={() => save(true)}>
              Save anyway
            </button>
          </div>
        ) : (
          <button type="submit" className={`h-14 w-full rounded-[14px] text-lg lg:w-auto lg:px-8 ${btnPrimary}`} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Save and see result' : 'Save changes'}
          </button>
        )}
      </form>
    </div>
  )
}
