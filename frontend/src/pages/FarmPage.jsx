import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { Badge, Checkbox, EmptyState, ErrorAlert, InactiveBadge, Loading, Modal, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { formatDateTime, formatNumber } from '../lib/format.js'
import { ENVIRONMENT_LABEL, MOISTURE_STATUS } from '../lib/status.js'
import { btnPrimary, btnSecondary, btnSmall, linkClass } from '../lib/styles.js'

export default function FarmPage() {
  const { farmId } = useParams()
  const { data, error, loading, reload } = useFetch(`/farms/${farmId}`)
  // null = closed, {} = creating, a zone = editing it
  const [editing, setEditing] = useState(null)

  if (loading) return <Loading />
  if (error) return <ErrorAlert>{error}</ErrorAlert>

  const farm = data.farm

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link to="/farms" className={linkClass}>
          ← All farms
        </Link>
      </p>

      <PageHeader title={farm.name} subtitle={farm.location}>
        {farm.zones.length > 0 && (
          <Link to={`/farms/${farm.id}/history`} className={btnSecondary}>
            Farm history
          </Link>
        )}
        {farm.is_active ? (
          <button type="button" className={btnPrimary} onClick={() => setEditing({})}>
            New zone
          </button>
        ) : (
          <InactiveBadge />
        )}
      </PageHeader>

      {!farm.is_active && (
        <p className="mb-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
          This farm is inactive. Its zones and history can be viewed, but no new zones or readings can be added.
        </p>
      )}

      {farm.zones.length === 0 && (
        <EmptyState>No zones yet. A zone is one bed, rack, or rooftop section growing one crop.</EmptyState>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {farm.zones.map((zone) => {
          const latest = zone.latest_reading
          const status = latest ? MOISTURE_STATUS[latest.moisture_status] : null
          const canEnter = farm.is_active && zone.is_active

          return (
            <div key={zone.id} className="flex flex-col rounded-xl border border-stone-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/zones/${zone.id}`} className="text-lg font-semibold text-stone-900 hover:text-green-700">
                  {zone.name}
                </Link>
                {!zone.is_active ? (
                  <InactiveBadge />
                ) : status ? (
                  <Badge className={status.badge}>{status.label}</Badge>
                ) : (
                  <Badge className="bg-stone-100 text-stone-600">No readings</Badge>
                )}
              </div>
              <p className="text-sm text-stone-600">
                {zone.crop.name} · {ENVIRONMENT_LABEL[zone.environment]} · {formatNumber(zone.water_factor)} L per point
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {latest
                  ? `Soil moisture ${formatNumber(latest.soil_moisture)}% · ${formatDateTime(latest.recorded_at)}`
                  : 'Nothing recorded yet.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {canEnter && (
                  <Link to={`/zones/${zone.id}/readings/new`} className={btnPrimary}>
                    Enter reading
                  </Link>
                )}
                <Link to={`/zones/${zone.id}`} className={btnSmall}>
                  History
                </Link>
                <button type="button" className={btnSmall} onClick={() => setEditing(zone)}>
                  Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <ZoneForm
          farmId={farm.id}
          zone={editing}
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

function ZoneForm({ farmId, zone, onClose, onSaved }) {
  const isNew = !zone.id
  const crops = useFetch('/crops')
  const [form, setForm] = useState({
    name: zone.name ?? '',
    crop_id: zone.crop_id ?? '',
    environment: zone.environment ?? 'rooftop',
    water_factor: zone.water_factor ?? '',
    is_active: zone.is_active ?? true,
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  // A zone keeps a crop that was retired after the zone was created, so make sure it is still listed.
  const cropOptions = [...(crops.data?.crops ?? [])]
  if (zone.crop && !cropOptions.some((crop) => crop.id === zone.crop.id)) {
    cropOptions.push({ ...zone.crop, name: `${zone.crop.name} (retired)` })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      if (isNew) {
        await api.post(`/farms/${farmId}/zones`, form)
      } else {
        await api.put(`/zones/${zone.id}`, form)
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
    <Modal title={isNew ? 'New zone' : 'Edit zone'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert>{error}</ErrorAlert>

        <FormField
          label="Zone name"
          id="zone_name"
          required
          autoFocus
          placeholder="e.g. Bed A, Rack 2"
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          error={fieldErrors.name}
        />
        <FormField
          label="Crop"
          id="zone_crop"
          as="select"
          required
          value={form.crop_id}
          onChange={(event) => set('crop_id', event.target.value)}
          error={fieldErrors.crop_id}
        >
          <option value="" disabled>
            {crops.loading ? 'Loading…' : 'Choose a crop'}
          </option>
          {cropOptions.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {crop.name}
            </option>
          ))}
        </FormField>
        <FormField
          label="Environment"
          id="zone_environment"
          as="select"
          required
          value={form.environment}
          onChange={(event) => set('environment', event.target.value)}
          error={fieldErrors.environment}
        >
          <option value="rooftop">Rooftop</option>
          <option value="indoor">Indoor</option>
        </FormField>
        <FormField
          label="Water factor (liters per percentage point)"
          id="zone_water_factor"
          type="number"
          inputMode="decimal"
          step="0.001"
          min="0.001"
          required
          value={form.water_factor}
          onChange={(event) => set('water_factor', event.target.value)}
          error={fieldErrors.water_factor}
          hint="How many liters raise this zone's soil moisture by 1 point. Bigger beds and faster-draining soil need a higher number."
        />

        {!isNew && (
          <div>
            <Checkbox
              id="zone_is_active"
              label="Zone is active"
              checked={form.is_active}
              onChange={(checked) => set('is_active', checked)}
            />
            <p className="mt-1 text-sm text-stone-500">An inactive zone takes no new readings, but keeps its history.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary} disabled={saving}>
            {saving ? 'Saving…' : 'Save zone'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
