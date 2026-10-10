import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { AppIcon } from '../components/icons.jsx'
import { Checkbox, EmptyState, ErrorAlert, FormActions, Loading, Modal, PageHeader } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import useFetch from '../hooks/useFetch.js'

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
          <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
            <AppIcon name="plus" />
            New farm
          </button>
        )}
      </PageHeader>

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && farms.length === 0 && (
        <EmptyState icon="leaf" title="No farms yet">
          {isSuperAdmin ? 'Create the first one with “New farm”.' : 'You are not assigned to any farm yet. Ask your Super Admin to assign you.'}
        </EmptyState>
      )}

      <div className="farm-grid">
        {farms.map((farm) => (
          <section key={farm.id} className={farm.is_active ? 'card farm-card' : 'card farm-card is-inactive'}>
            <div className="farm-card-banner">
              <AppIcon name="sprout" />
              <div className="banner-tags">
                {!farm.is_active && <span>Inactive</span>}
                <span>
                  {farm.zones_count} {farm.zones_count === 1 ? 'zone' : 'zones'}
                </span>
              </div>
              <div className="farm-art" aria-hidden="true">
                <AppIcon name="leaf" />
                <AppIcon name="sprout" />
                <AppIcon name="leaf" />
              </div>
            </div>
            <div className="farm-card-body">
              <h2>{farm.name}</h2>
              {farm.location && (
                <p className="muted icon-line">
                  <AppIcon name="map-pin" />
                  {farm.location}
                </p>
              )}
              {farm.description && <p className="muted">{farm.description}</p>}
              {isSuperAdmin && (
                <div className="farm-admin">
                  <span className="field-label">Assigned Admins</span>
                  <span className="icon-line">
                    <AppIcon name="users" />
                    {farm.users.length ? farm.users.map((admin) => admin.name).join(', ') : 'None assigned yet'}
                  </span>
                </div>
              )}
              <div className="zone-actions">
                <Link to={`/farms/${farm.id}`} className="btn btn-primary">
                  Open farm
                  <AppIcon name="arrow-right" />
                </Link>
                {isSuperAdmin && (
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(farm)}>
                    <AppIcon name="pencil" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </section>
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
