import { useState } from 'react'
import api, { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { AppIcon } from '../components/icons.jsx'
import { Badge, Checkbox, ConfirmDialog, EmptyState, ErrorAlert, FormActions, Loading, Modal, PageHeader, StatusBadge } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import useFetch from '../hooks/useFetch.js'
import { initials } from '../lib/format.js'
import { FLAG } from '../lib/status.js'

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

  const confirmAction = () => {
    const { kind, account } = confirming
    setConfirming(null)
    if (kind === 'reset') resetPassword(account)
    else setActive(account, false)
  }

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Admins work on the farms you assign them. Super Admins manage everything, including these accounts."
      >
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
          <AppIcon name="plus" />
          New account
        </button>
      </PageHeader>

      <ErrorAlert onRetry={error ? reload : undefined}>{error || actionError}</ErrorAlert>
      {loading && <Loading />}

      {!loading && !error && accounts.length === 0 && (
        <EmptyState icon="users" title="No accounts yet">
          Add an account and assign farms.
        </EmptyState>
      )}

      <div className="account-list">
        {accounts.map((account) => {
          const isMe = account.id === me.id
          const isSuperAdmin = account.role === 'super_admin'

          return (
            <section key={account.id} className={account.is_active ? 'card account-card' : 'card account-card is-inactive'}>
              <span className="account-avatar" aria-hidden="true">
                {initials(account.name)}
              </span>
              <div className="account-details">
                <div className="account-name">
                  <h2>{account.name}</h2>
                  <StatusBadge status={isSuperAdmin ? FLAG.superAdmin : FLAG.admin} />
                  {isMe && <Badge>You</Badge>}
                  {!account.is_active && <StatusBadge status={FLAG.inactive} />}
                  {account.is_active && account.must_change_password && (
                    <Badge className="badge-warning" icon="key">
                      Temporary password
                    </Badge>
                  )}
                </div>
                <p className="muted">{account.email}</p>
                <p className="icon-line">
                  <AppIcon name="leaf" />
                  Farms:{' '}
                  {isSuperAdmin ? 'All farms' : account.farms.length ? account.farms.map((farm) => farm.name).join(', ') : 'None assigned yet'}
                </p>
              </div>
              <div className="account-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(account)}>
                  <AppIcon name="pencil" />
                  Edit
                </button>
                {/* Your own account is protected, so there is always a Super Admin who can log in. */}
                {!isMe && (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={() => setConfirming({ kind: 'reset', account })}>
                      Reset password
                    </button>
                    {account.is_active ? (
                      <button type="button" className="btn btn-danger" onClick={() => setConfirming({ kind: 'deactivate', account })}>
                        Deactivate
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={() => setActive(account, true)}>
                        Reactivate
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>
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
          danger
          onConfirm={confirmAction}
          onCancel={() => setConfirming(null)}
        >
          They won’t be able to log in. Their readings stay. You can reactivate the account later.
        </ConfirmDialog>
      )}

      {credentials && <TemporaryPassword credentials={credentials} onClose={() => setCredentials(null)} />}
    </>
  )
}

// Shown once, right after an account is created or its password is reset.
function TemporaryPassword({ credentials, onClose }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(credentials.password)
      setCopied(true)
    } catch {
      // No clipboard access (for example an insecure address): the password can still be selected by hand.
      setCopied(false)
    }
  }

  return (
    <Modal title="Temporary password" onClose={onClose}>
      <p className="muted">
        Give these to {credentials.name}. They will be asked to choose their own password at first login.
      </p>
      <p style={{ marginTop: 16 }}>
        <span className="muted">Email</span>
        <br />
        <strong>{credentials.email}</strong>
      </p>
      <div className="password-display">
        <code>{credentials.password}</code>
        <button type="button" className="btn btn-secondary" onClick={copy}>
          <AppIcon name={copied ? 'check' : 'copy'} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="warning-text">Copy it now. This password is not shown again.</p>
      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
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
          <fieldset className="checklist">
            <legend>Assigned farms</legend>
            {farms.loading && <p className="muted">Loading…</p>}
            {farms.data?.farms.length === 0 && <p className="muted">No farms yet. You can assign farms later.</p>}
            {farms.data?.farms.map((farm) => (
              <Checkbox
                key={farm.id}
                id={`account_farm_${farm.id}`}
                label={farm.is_active ? farm.name : `${farm.name} (inactive)`}
                checked={form.farm_ids.includes(farm.id)}
                onChange={(checked) => toggleFarm(farm.id, checked)}
              />
            ))}
          </fieldset>
        )}

        {isNew && <p className="muted">A temporary password is generated and shown to you after saving.</p>}

        <FormActions onCancel={onClose} saving={saving} saveLabel={isNew ? 'Create account' : 'Save changes'} />
      </form>
    </Modal>
  )
}
