import { useState } from 'react'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { Badge, Checkbox, ConfirmDialog, EmptyState, ErrorAlert, InactiveBadge, FormActions, Loading, Modal, PageHeader } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import useFetch from '../hooks/useFetch.js'
import { FLAG } from '../lib/status.js'
import { btnPrimary, btnSmall } from '../lib/styles.js'

// Every account: Admins and Super Admins.
export default function AdminAccountsPage() {
  const { user: me } = useAuth()
  const { data, error, loading, reload } = useFetch('/super-admin/admins')
  // null = closed, {} = creating, an account = editing it
  const [editing, setEditing] = useState(null)
  // { name, email, password } shown once after creating an account or resetting a password
  const [credentials, setCredentials] = useState(null)
  const [actionError, setActionError] = useState('')
  // { kind: 'reset' | 'deactivate', account } while a confirmation window is open
  const [confirming, setConfirming] = useState(null)

  const confirmAction = () => {
    const { kind, account } = confirming
    setConfirming(null)
    if (kind === 'reset') resetPassword(account)
    else setActive(account, false)
  }

  const accounts = data?.admins ?? []

  const resetPassword = async (account) => {
    setActionError('')
    try {
      const response = await api.post(`/super-admin/admins/${account.id}/reset-password`)
      setCredentials({ name: account.name, email: account.email, password: response.data.temporary_password })
      reload()
    } catch (err) {
      setActionError(readError(err).message)
    }
  }

  const setActive = async (account, isActive) => {
    setActionError('')
    try {
      await api.patch(`/super-admin/admins/${account.id}/active`, { is_active: isActive })
      reload()
    } catch (err) {
      setActionError(readError(err).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Admins work on the farms you assign them. Super Admins manage everything, including these accounts."
      >
        <button type="button" className={btnPrimary} onClick={() => setEditing({})}>
          New account
        </button>
      </PageHeader>

      <ErrorAlert>{error || actionError}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && accounts.length === 0 && <EmptyState>No accounts yet.</EmptyState>}

      <div className="space-y-3">
        {accounts.map((account) => {
          const isMe = account.id === me.id
          const isSuperAdmin = account.role === 'super_admin'

          return (
            <div key={account.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-stone-900">
                    {account.name}
                    {isSuperAdmin ? (
                      <Badge className={FLAG.superAdmin.badge}>Super Admin</Badge>
                    ) : (
                      <Badge className={FLAG.neutral.badge}>Admin</Badge>
                    )}
                    {isMe && <Badge className={FLAG.neutral.badge}>You</Badge>}
                    {!account.is_active && <InactiveBadge />}
                    {account.is_active && account.must_change_password && (
                      <Badge className={FLAG.unusual.badge}>Temporary password</Badge>
                    )}
                  </p>
                  <p className="text-sm text-stone-600">{account.email}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    {isSuperAdmin
                      ? 'Farms: all'
                      : `Farms: ${account.farms.length ? account.farms.map((farm) => farm.name).join(', ') : 'none assigned'}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnSmall} onClick={() => setEditing(account)}>
                    Edit
                  </button>
                  {/* Your own account is protected, so there is always a Super Admin who can log in. */}
                  {!isMe && (
                    <>
                      <button type="button" className={btnSmall} onClick={() => setConfirming({ kind: 'reset', account })}>
                        Reset password
                      </button>
                      <button type="button" className={btnSmall} onClick={() => (account.is_active ? setConfirming({ kind: 'deactivate', account }) : setActive(account, true))}>
                        {account.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <AccountForm
          account={editing}
          isMe={editing.id === me.id}
          onClose={() => setEditing(null)}
          onSaved={(response) => {
            setEditing(null)
            if (response.temporary_password) {
              setCredentials({
                name: response.admin.name,
                email: response.admin.email,
                password: response.temporary_password,
              })
            }
            reload()
          }}
        />
      )}

      {confirming?.kind === 'reset' && (
        <ConfirmDialog
          title={`Reset the password for ${confirming.account.name}?`}
          confirmLabel="Reset password"
          onConfirm={confirmAction}
          onCancel={() => setConfirming(null)}
        >
          They will be signed out everywhere. You will get a new temporary password to give them.
        </ConfirmDialog>
      )}

      {confirming?.kind === 'deactivate' && (
        <ConfirmDialog
          title={`Deactivate ${confirming.account.name}?`}
          confirmLabel="Deactivate"
          onConfirm={confirmAction}
          onCancel={() => setConfirming(null)}
        >
          They won’t be able to log in. Their readings stay. You can reactivate the account later.
        </ConfirmDialog>
      )}

      {credentials && (
        <Modal title="Temporary password" onClose={() => setCredentials(null)}>
          <p className="text-sm text-stone-600">
            Give these to {credentials.name}. They will be asked to choose their own password at first login.
          </p>
          <dl className="mt-4 space-y-2 rounded-lg bg-stone-50 p-4 text-sm">
            <div>
              <dt className="text-stone-500">Email</dt>
              <dd className="font-medium text-stone-900">{credentials.email}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Temporary password</dt>
              <dd className="select-all font-mono text-lg font-semibold text-stone-900">{credentials.password}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm font-medium text-orange-800">
            Copy it now. This password is not shown again after you close this window.
          </p>
          <div className="mt-4 flex justify-end">
            <button type="button" className={btnPrimary} onClick={() => setCredentials(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AccountForm({ account, isMe, onClose, onSaved }) {
  const isNew = !account.id
  const farms = useFetch('/farms')
  const [form, setForm] = useState({
    name: account.name ?? '',
    email: account.email ?? '',
    role: account.role ?? 'admin',
    farm_ids: (account.farms ?? []).map((farm) => farm.id),
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const toggleFarm = (id, checked) =>
    set('farm_ids', checked ? [...form.farm_ids, id] : form.farm_ids.filter((farmId) => farmId !== id))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      const response = isNew
        ? await api.post('/super-admin/admins', form)
        : await api.put(`/super-admin/admins/${account.id}`, form)
      onSaved(response.data)
    } catch (err) {
      const { message, fields } = readError(err)
      setFieldErrors(fields)
      setError(message)
      setSaving(false)
    }
  }

  return (
    <Modal title={isNew ? 'New account' : 'Edit account'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert>{error}</ErrorAlert>

        <FormField
          label="Full name"
          id="account_name"
          required
          autoFocus
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          error={fieldErrors.name}
        />
        <FormField
          label="Email"
          id="account_email"
          type="email"
          required
          value={form.email}
          onChange={(event) => set('email', event.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          label="Role"
          id="account_role"
          as="select"
          value={form.role}
          disabled={isMe}
          onChange={(event) => set('role', event.target.value)}
          error={fieldErrors.role}
          hint={
            isMe
              ? 'You cannot change your own role.'
              : 'A Super Admin can manage accounts, farms and the crop library, and sees every farm.'
          }
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </FormField>

        {form.role === 'admin' && (
          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">Assigned farms</p>
            {farms.loading && <p className="text-sm text-stone-500">Loading…</p>}
            {farms.data?.farms.length === 0 && (
              <p className="text-sm text-stone-500">No farms yet. You can assign farms later.</p>
            )}
            <div className="space-y-2">
              {farms.data?.farms.map((farm) => (
                <Checkbox
                  key={farm.id}
                  id={`account_farm_${farm.id}`}
                  label={farm.is_active ? farm.name : `${farm.name} (inactive)`}
                  checked={form.farm_ids.includes(farm.id)}
                  onChange={(checked) => toggleFarm(farm.id, checked)}
                />
              ))}
            </div>
          </div>
        )}

        {isNew && (
          <p className="text-sm text-stone-500">A temporary password is generated and shown to you after saving.</p>
        )}

        <FormActions onCancel={onClose} saving={saving} saveLabel={isNew ? 'Create account' : 'Save changes'} />
      </form>
    </Modal>
  )
}
