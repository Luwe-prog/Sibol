import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { Checkbox, EmptyState, ErrorAlert, InactiveBadge, FormActions, Loading, Modal, PageHeader } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import useFetch from '../hooks/useFetch.js'
import { btnPrimary, btnSmall } from '../lib/styles.js'

export default function FarmsPage() {
  const { isSuperAdmin } = useAuth()
  const { data, error, loading, reload } = useFetch('/farms')
  // null = closed, {} = creating, a farm = editing it
  const [editing, setEditing] = useState(null)

  const farms = data?.farms ?? []

  return (
    <div>
      <PageHeader
        title="Farms"
        subtitle={isSuperAdmin ? 'All farms in the system.' : 'The farms you are assigned to.'}
      >
        {isSuperAdmin && (
          <button type="button" className={btnPrimary} onClick={() => setEditing({})}>
            New farm
          </button>
        )}
      </PageHeader>

      <ErrorAlert>{error}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && farms.length === 0 && (
        <EmptyState>
          {isSuperAdmin
            ? 'No farms yet. Create the first one with "New farm".'
            : 'You are not assigned to any farm yet. Ask your Super Admin to assign you.'}
        </EmptyState>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {farms.map((farm) => (
          <div key={farm.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/farms/${farm.id}`} className="text-lg font-semibold text-stone-900 hover:text-green-700">
                {farm.name}
              </Link>
              {!farm.is_active && <InactiveBadge />}
            </div>
            {farm.location && <p className="text-sm text-stone-500">{farm.location}</p>}
            {farm.description && <p className="mt-2 text-sm text-stone-600">{farm.description}</p>}

            <p className="mt-3 text-sm text-stone-600">
              {farm.zones_count} {farm.zones_count === 1 ? 'zone' : 'zones'}
            </p>
            {isSuperAdmin && (
              <p className="text-sm text-stone-600">
                Admins: {farm.users.length ? farm.users.map((admin) => admin.name).join(', ') : 'none assigned'}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <Link to={`/farms/${farm.id}`} className={btnSmall}>
                Open
              </Link>
              {isSuperAdmin && (
                <button type="button" className={btnSmall} onClick={() => setEditing(farm)}>
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <FarmForm
          farm={editing}
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

function FarmForm({ farm, onClose, onSaved }) {
  const isNew = !farm.id
  const admins = useFetch('/super-admin/admins')
  const [form, setForm] = useState({
    name: farm.name ?? '',
    location: farm.location ?? '',
    description: farm.description ?? '',
    is_active: farm.is_active ?? true,
    admin_ids: (farm.users ?? []).map((admin) => admin.id),
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const toggleAdmin = (id, checked) =>
    set('admin_ids', checked ? [...form.admin_ids, id] : form.admin_ids.filter((adminId) => adminId !== id))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      if (isNew) {
        await api.post('/super-admin/farms', form)
      } else {
        await api.put(`/super-admin/farms/${farm.id}`, form)
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
    <Modal title={isNew ? 'New farm' : 'Edit farm'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert>{error}</ErrorAlert>

        <FormField
          label="Farm name"
          id="farm_name"
          required
          autoFocus
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          error={fieldErrors.name}
        />
        <FormField
          label="Location (optional)"
          id="farm_location"
          value={form.location}
          onChange={(event) => set('location', event.target.value)}
          error={fieldErrors.location}
        />
        <FormField
          label="Description (optional)"
          id="farm_description"
          as="textarea"
          rows={2}
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          error={fieldErrors.description}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">Assigned Admins</p>
          {admins.loading && <p className="text-sm text-stone-500">Loading…</p>}
          {admins.data?.admins.length === 0 && (
            <p className="text-sm text-stone-500">No Admin accounts yet. Create them under "Admin accounts".</p>
          )}
          <div className="space-y-2">
            {admins.data?.admins.map((admin) => (
              <Checkbox
                key={admin.id}
                id={`farm_admin_${admin.id}`}
                label={admin.is_active ? `${admin.name} (${admin.email})` : `${admin.name} (${admin.email}), deactivated`}
                checked={form.admin_ids.includes(admin.id)}
                onChange={(checked) => toggleAdmin(admin.id, checked)}
              />
            ))}
          </div>
        </div>

        {!isNew && (
          <div>
            <Checkbox
              id="farm_is_active"
              label="Farm is active"
              checked={form.is_active}
              onChange={(checked) => set('is_active', checked)}
            />
            <p className="mt-1 text-sm text-stone-500">
              An inactive farm takes no new zones or readings, but its history stays viewable.
            </p>
          </div>
        )}

        <FormActions onCancel={onClose} saving={saving} saveLabel={'Save farm'} />
      </form>
    </Modal>
  )
}
