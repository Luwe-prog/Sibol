import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import '../components/app.css'
import { useAuth } from '../context/useAuth.js'

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // True on first login with a temporary password; false when the user chose to change it.
  const forced = user.must_change_password

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      await changePassword(currentPassword, password, passwordConfirmation)
      navigate('/', { replace: true })
    } catch (err) {
      const { message, fields } = readError(err)
      setFieldErrors(fields)
      if (Object.keys(fields).length === 0) setError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="sibol-app flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-stone-900">
            {forced ? 'Set a new password' : 'Change password'}
          </h1>
          {forced && (
            <p className="mt-1 text-sm text-stone-500">
              You are using a temporary password. Choose your own before continuing.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-white p-6 shadow-sm">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <FormField
            label={forced ? 'Temporary password' : 'Current password'}
            id="current_password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={fieldErrors.current_password}
          />
          <FormField
            label="New password (at least 8 characters)"
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />
          <FormField
            label="Confirm new password"
            id="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-green-700 px-4 py-2.5 font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save new password'}
          </button>

          <button
            type="button"
            onClick={forced ? logout : () => navigate('/')}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            {forced ? 'Log out' : 'Cancel'}
          </button>
        </form>
      </div>
    </div>
  )
}
