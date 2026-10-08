import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/useAuth.js'

const navLinkClass = ({ isActive }) =>
  isActive
    ? 'flex items-center gap-1.5 whitespace-nowrap border-b-2 border-green-700 px-1 py-2.5 text-sm font-medium text-green-700'
    : 'flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-1 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900'

export default function AppLayout() {
  const { user, isSuperAdmin, logout } = useAuth()
  const { pathname } = useLocation()
  // Zones that are too dry, too wet, or stale. Shown as a badge on the Dashboard link from every page.
  const [attentionCount, setAttentionCount] = useState(0)

  // Re-checked on every page change, so the badge is current right after a reading is saved.
  useEffect(() => {
    let current = true
    api
      .get('/dashboard')
      .then((response) => {
        if (current) setAttentionCount(response.data.summary.attention)
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-stone-50 print:bg-white">
      <header className="border-b border-stone-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-green-700">
            Sibol
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/change-password" className="text-right leading-tight hover:underline" title="Change password">
              <p className="font-medium text-stone-800">{user.name}</p>
              <p className="text-stone-500">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-100"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4">
          <NavLink to="/" end className={navLinkClass}>
            Dashboard
            {attentionCount > 0 && (
              <span
                className="rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white"
                title={`${attentionCount} ${attentionCount === 1 ? 'zone needs' : 'zones need'} attention`}
              >
                {attentionCount}
                <span className="sr-only"> {attentionCount === 1 ? 'zone needs' : 'zones need'} attention</span>
              </span>
            )}
          </NavLink>
          <NavLink to="/farms" className={navLinkClass}>
            Farms
          </NavLink>
          <NavLink to="/reports/water" className={navLinkClass}>
            Water report
          </NavLink>
          {isSuperAdmin && (
            <>
              <NavLink to="/admin/accounts" className={navLinkClass}>
                Accounts
              </NavLink>
              <NavLink to="/admin/crops" className={navLinkClass}>
                Crop library
              </NavLink>
              <NavLink to="/admin/activity" className={navLinkClass}>
                Activity log
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:p-0">
        {/* Keeps the menu on screen while a page's code is still loading. */}
        <Suspense fallback={<p className="py-10 text-center text-stone-500">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
