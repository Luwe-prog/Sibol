import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function FullPageMessage({ children }) {
  return <div className="flex min-h-screen items-center justify-center bg-cream text-stone-500">{children}</div>
}

// Login page only: a signed-in user is sent into the app.
export function GuestOnly() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageMessage>Loading…</FullPageMessage>
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

// Any signed-in user, including one still on a temporary password.
// A visitor who is not logged in sees `landing` (the public landing page) at "/",
// and is sent to the login page from anywhere else.
export function RequireAuth({ landing = null }) {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) return <FullPageMessage>Loading…</FullPageMessage>
  if (!user) return landing && pathname === '/' ? landing : <Navigate to="/login" replace />
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
