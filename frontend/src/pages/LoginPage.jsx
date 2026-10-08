import { useState } from 'react'
import { readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/useAuth.js'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      // On success the route guards redirect, so there is nothing to do here.
      await login(email, password)
    } catch (err) {
      const { message, fields } = readError(err)
      setError(fields.email ?? message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold text-green-700">Sibol</h1>
          <p className="mt-1 text-sm text-stone-500">Indoor and rooftop farm monitoring</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <FormField
            label="Email"
            id="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FormField
            label="Password"
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-green-700 px-4 py-2.5 font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          No account? Ask your Super Admin to create one for you.
        </p>
      </div>
    </div>
  )
}
