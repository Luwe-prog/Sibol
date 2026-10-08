import { useState } from 'react'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { Checkbox, ErrorAlert, InactiveBadge, FormActions, Loading, Modal, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatNumber } from '../lib/format.js'
import { btnPrimary, btnSmall } from '../lib/styles.js'

export default function CropsPage() {
  const { data, error, loading, reload } = useFetch('/super-admin/crops')
  // null = closed, {} = creating, a crop = editing it
  const [editing, setEditing] = useState(null)

  const crops = data?.crops ?? []

  return (
    <div>
      <PageHeader title="Crop library" subtitle="Ideal ranges per crop. Readings are judged against these.">
        <button type="button" className={btnPrimary} onClick={() => setEditing({})}>
          New crop
        </button>
      </PageHeader>

      <ErrorAlert>{error}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Crop</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Soil moisture</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Temperature</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Humidity</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Source</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Zones</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {crops.map((crop) => (
                <tr key={crop.id}>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-stone-900">
                    {crop.name} {!crop.is_active && <InactiveBadge />}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatNumber(crop.soil_moisture_min)}–{formatNumber(crop.soil_moisture_max)}%
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatNumber(crop.temp_min)}–{formatNumber(crop.temp_max)} °C
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatNumber(crop.humidity_min)}–{formatNumber(crop.humidity_max)}%
                  </td>
                  <td className="px-3 py-2 text-stone-600">{crop.source_reference}</td>
                  <td className="whitespace-nowrap px-3 py-2">{crop.zones_count}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button type="button" className={btnSmall} onClick={() => setEditing(crop)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
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
