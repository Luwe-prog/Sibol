import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { readError } from '../api/client.js'
import { AppIcon } from '../components/icons.jsx'
import { ErrorAlert, Loading, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatNumber, fromLocalInputValue, toLocalInputValue } from '../lib/format.js'
import { ENVIRONMENT_LABEL } from '../lib/status.js'

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

// One field in the design's style: label above, optional icon and unit inside, hint or error below.
function Field({ id, label, optional, icon, unit, hint, error, as: Control = 'input', ...controlProps }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {optional && <span className="muted"> (optional)</span>}
      </label>
      {Control === 'textarea' ? (
        <textarea id={id} aria-invalid={error ? true : undefined} {...controlProps} />
      ) : (
        <span className={icon ? 'field-control with-icon' : 'field-control'}>
          {icon && <AppIcon name={icon} />}
          <input id={id} aria-invalid={error ? true : undefined} aria-describedby={hint ? `${id}-hint` : undefined} {...controlProps} />
          {unit && <span className="unit">{unit}</span>}
        </span>
      )}
      {hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && <span className="field-error">{error}</span>}
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

  const measurement = { type: 'number', inputMode: 'decimal', autoComplete: 'off', step: '0.1', min: '0', required: true }

  return (
    <div className="reading-page">
      <Link to={backTo} className="btn btn-text">
        <AppIcon name="arrow-left" />
        {isNew ? `Back to ${zone.name}` : 'Back to the reading'}
      </Link>

      <PageHeader
        title={isNew ? 'Enter reading' : 'Edit reading'}
        subtitle={`${zone.name} · ${crop.name} · ${ENVIRONMENT_LABEL[zone.environment]}`}
      />

      <section className="card reading-card">
        <div className="reading-intro">
          <span className="soft-icon">
            <AppIcon name="sprout" />
          </span>
          <div>
            <h2>A moment to check in</h2>
            <p className="muted">Measure your growing bed, then enter the values below.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <ErrorAlert>{error}</ErrorAlert>

          <div className="reading-fields">
            <Field
              id="soil_moisture"
              label="Soil moisture"
              icon="droplet"
              unit="%"
              max="100"
              placeholder="e.g. 65"
              autoFocus
              {...measurement}
              value={form.soil_moisture}
              onChange={(event) => set('soil_moisture', event.target.value)}
              error={fieldErrors.soil_moisture}
              hint={`Ideal for ${crop.name}: ${formatNumber(crop.soil_moisture_min)}–${formatNumber(crop.soil_moisture_max)}%`}
            />
            <Field
              id="temperature"
              label="Temperature"
              icon="thermometer"
              unit="°C"
              max="60"
              placeholder="e.g. 26"
              {...measurement}
              value={form.temperature}
              onChange={(event) => set('temperature', event.target.value)}
              error={fieldErrors.temperature}
              hint={`Ideal: ${formatNumber(crop.temp_min)}–${formatNumber(crop.temp_max)} °C`}
            />
            <Field
              id="humidity"
              label="Humidity"
              icon="wind"
              unit="%"
              max="100"
              placeholder="e.g. 60"
              {...measurement}
              value={form.humidity}
              onChange={(event) => set('humidity', event.target.value)}
              error={fieldErrors.humidity}
              hint={`Ideal: ${formatNumber(crop.humidity_min)}–${formatNumber(crop.humidity_max)}%`}
            />
          </div>

          <div className="form-divider" />

          <div className="reading-meta">
            <div>
              <Field
                id="recorded_at"
                label="Recorded at"
                type="datetime-local"
                required
                max={toLocalInputValue()}
                value={form.recorded_at}
                onChange={(event) => set('recorded_at', event.target.value)}
                error={fieldErrors.recorded_at}
                hint="Change this only if you took the reading earlier."
              />
              {!isNew && (
                <Field
                  id="water_applied_liters"
                  label="Water applied"
                  optional
                  unit="L"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={form.water_applied_liters}
                  onChange={(event) => set('water_applied_liters', event.target.value)}
                  error={fieldErrors.water_applied_liters}
                />
              )}
            </div>
            <Field
              id="notes"
              label="Notes"
              optional
              as="textarea"
              rows={isNew ? 3 : 6}
              placeholder="Anything you noticed about this bed?"
              value={form.notes}
              onChange={(event) => set('notes', event.target.value)}
              error={fieldErrors.notes}
            />
          </div>

          {suspiciousReasons && (
            <div className="unusual-box" role="alert">
              <h3>
                <AppIcon name="warning" />
                This reading looks unusual. Please check it.
              </h3>
              <ul>
                {suspiciousReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p>Correct the values above, or save it anyway if they are right. It will be marked as unusual.</p>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setSuspiciousReasons(null)}>
                  Edit values
                </button>
                <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save(true)}>
                  Save anyway
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary save-reading" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Save and see result' : 'Save changes'}
            {!saving && <AppIcon name="arrow-right" />}
          </button>
        </form>
      </section>
    </div>
  )
}
