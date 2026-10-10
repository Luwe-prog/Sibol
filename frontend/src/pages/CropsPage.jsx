import { useState } from 'react'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { AppIcon } from '../components/icons.jsx'
import { Checkbox, ErrorAlert, FormActions, InactiveBadge, Loading, Modal, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatNumber } from '../lib/format.js'

// A range as numbers with a small bar showing where it sits on the scale (0 to `scale`).
function Range({ min, max, unit, scale }) {
  return (
    <div className="range-cell">
      <span>
        {formatNumber(min)}–{formatNumber(max)}
        {unit}
      </span>
      <div className="range-track" aria-hidden="true">
        <span style={{ marginLeft: `${(min / scale) * 100}%`, width: `${((max - min) / scale) * 100}%` }} />
      </div>
    </div>
  )
}

export default function CropsPage() {
  const { data, error, loading, reload } = useFetch('/super-admin/crops')
  // null = closed, {} = creating, a crop = editing it
  const [editing, setEditing] = useState(null)

  const crops = data?.crops ?? []

  return (
    <>
      <PageHeader title="Crop library" subtitle="Ideal ranges per crop. Readings are judged against these.">
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
          <AppIcon name="plus" />
          New crop
        </button>
      </PageHeader>

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && (
        <section className="card table-card">
          <div className="table-scroll">
            <table className="data-table crop-table">
              <thead>
                <tr>
                  <th scope="col">Crop</th>
                  <th scope="col">Soil moisture</th>
                  <th scope="col">Temperature</th>
                  <th scope="col">Humidity</th>
                  <th scope="col">Source</th>
                  <th scope="col">Zones</th>
                  <th scope="col">Edit</th>
                </tr>
              </thead>
              <tbody>
                {crops.map((crop) => (
                  <tr key={crop.id}>
                    <td>
                      <span className="crop-name">
                        <span className="soft-icon">
                          <AppIcon name="sprout" />
                        </span>
                        <strong>{crop.name}</strong>
                        {!crop.is_active && <InactiveBadge />}
                      </span>
                    </td>
                    <td data-label="Soil moisture">
                      <Range min={crop.soil_moisture_min} max={crop.soil_moisture_max} unit="%" scale={100} />
                    </td>
                    <td data-label="Temperature">
                      <Range min={crop.temp_min} max={crop.temp_max} unit=" °C" scale={60} />
                    </td>
                    <td data-label="Humidity">
                      <Range min={crop.humidity_min} max={crop.humidity_max} unit="%" scale={100} />
                    </td>
                    <td data-label="Source">
                      <span className="source-label">{crop.source_reference || 'No source given'}</span>
                    </td>
                    <td data-label="Zones">{crop.zones_count}</td>
                    <td>
                      <button type="button" className="btn btn-text" onClick={() => setEditing(crop)} aria-label={`Edit ${crop.name}`}>
                        <AppIcon name="pencil" />
                        <span className="mobile-only">Edit crop</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editing && (
        <CropForm
          crop={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}

const RANGES = [
  { label: 'Soil moisture (%)', min: 'soil_moisture_min', max: 'soil_moisture_max', limit: 100 },
  { label: 'Temperature (°C)', min: 'temp_min', max: 'temp_max', limit: 60 },
  { label: 'Humidity (%)', min: 'humidity_min', max: 'humidity_max', limit: 100 },
]

function CropForm({ crop, onClose, onSaved }) {
  const isNew = !crop.id
  const [form, setForm] = useState({
    name: crop.name ?? '',
    soil_moisture_min: crop.soil_moisture_min ?? '',
    soil_moisture_max: crop.soil_moisture_max ?? '',
    temp_min: crop.temp_min ?? '',
    temp_max: crop.temp_max ?? '',
    humidity_min: crop.humidity_min ?? '',
    humidity_max: crop.humidity_max ?? '',
    source_reference: crop.source_reference ?? '',
    is_active: crop.is_active ?? true,
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      if (isNew) {
        await api.post('/super-admin/crops', form)
      } else {
        await api.put(`/super-admin/crops/${crop.id}`, form)
      }
      onSaved()
    } catch (err) {
      const { message, fields } = readError(err)
      setFieldErrors(fields)
      setError(message)
      setSaving(false)
    }
  }

  return (
    <Modal title={isNew ? 'New crop' : `Edit ${crop.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert>{error}</ErrorAlert>

        <FormField
          label="Crop name"
          id="crop_name"
          required
          autoFocus
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          error={fieldErrors.name}
        />

        {RANGES.map((range) => (
          <div key={range.min} className="grid grid-cols-2 gap-3">
            <FormField
              label={`${range.label} min`}
              id={`crop_${range.min}`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max={range.limit}
              required
              value={form[range.min]}
              onChange={(event) => set(range.min, event.target.value)}
              error={fieldErrors[range.min]}
            />
            <FormField
              label="max"
              id={`crop_${range.max}`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max={range.limit}
              required
              value={form[range.max]}
              onChange={(event) => set(range.max, event.target.value)}
              error={fieldErrors[range.max]}
            />
          </div>
        ))}

        <FormField
          label="Source of these ranges"
          id="crop_source"
          placeholder="e.g. DA, PhilRice, a university extension guide"
          value={form.source_reference}
          onChange={(event) => set('source_reference', event.target.value)}
          error={fieldErrors.source_reference}
        />

        {!isNew && (
          <div>
            <Checkbox
              id="crop_is_active"
              label="Crop is active"
              checked={form.is_active}
              onChange={(checked) => set('is_active', checked)}
            />
            <p className="mt-1 text-sm text-stone-500">
              An inactive crop cannot be picked for new zones. Zones already growing it keep it.
            </p>
          </div>
        )}

        <p className="text-sm text-stone-500">
          Changing these ranges affects new readings only. Past readings keep the status they were given.
        </p>

        <FormActions onCancel={onClose} saving={saving} saveLabel={'Save crop'} />
      </form>
    </Modal>
  )
}
