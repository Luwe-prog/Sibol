import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function FullPageMessage({ children }) {
  return <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-500">{children}</div>
}

// Login page only: a signed-in user is sent into the app.
export function GuestOnly() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageMessage>Loading…</FullPageMessage>
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

// Any signed-in user, including one still on a temporary password.
export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageMessage>Loading…</FullPageMessage>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

// The rest of the app: a temporary password must be replaced first.
export function RequirePasswordChanged() {
  const { user } = useAuth()

  if (user.must_change_password) return <Navigate to="/change-password" replace />
  return <Outlet />
}

// Super Admin screens.
export function RequireSuperAdmin() {
  const { isSuperAdmin } = useAuth()

  if (!isSuperAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
