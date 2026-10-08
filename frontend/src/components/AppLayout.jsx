import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/useAuth.js'
import { initials } from '../lib/format.js'
import { btnSecondary } from '../lib/styles.js'
import { AppIcon, SibolMark } from './icons.jsx'
import { Loading, Modal } from './ui.jsx'

const MAIN_ITEMS = [
  { key: 'dashboard', to: '/', label: 'Dashboard', icon: 'dashboard' },
  { key: 'farms', to: '/farms', label: 'Farms', icon: 'sprout' },
  { key: 'report', to: '/reports/water', label: 'Water report', icon: 'report' },
]

// Super Admin only.
const MANAGE_ITEMS = [
  { key: 'accounts', to: '/admin/accounts', label: 'Accounts', icon: 'users' },
  { key: 'crops', to: '/admin/crops', label: 'Crop library', icon: 'book' },
  { key: 'activity', to: '/admin/activity', label: 'Activity log', icon: 'history' },
]

// Which menu item the current page belongs to. Zone and reading pages sit under Farms.
const sectionOf = (pathname) => {
  if (pathname === '/') return 'dashboard'
  if (pathname.startsWith('/reports')) return 'report'
  if (pathname.startsWith('/admin/accounts')) return 'accounts'
  if (pathname.startsWith('/admin/crops')) return 'crops'
  if (pathname.startsWith('/admin/activity')) return 'activity'
  if (pathname.startsWith('/change-password')) return 'account'
  return 'farms'
}

const attentionLabel = (count) => `${count === 1 ? 'zone needs' : 'zones need'} attention`

export default function AppLayout() {
  const { user, isSuperAdmin, logout } = useAuth()
  const { pathname } = useLocation()
  // Zones that are too dry, too wet, or stale. Shown as a badge on the Dashboard item from every page.
  const [attentionCount, setAttentionCount] = useState(0)
  // Phone only: 'more' or 'account' while that sheet is open.
  const [sheet, setSheet] = useState(null)

  const section = sectionOf(pathname)
  const roleName = isSuperAdmin ? 'Super Admin' : 'Admin'
  const closeSheet = () => setSheet(null)

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
    <div className="min-h-screen bg-[#f7f6f1] text-stone-800 antialiased lg:pl-64 print:bg-white print:pl-0">
      {/* Laptop: fixed green sidebar. */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col overflow-hidden bg-green-900 px-3 pb-4 pt-6 text-green-100 lg:flex print:!hidden">
        <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -right-16 bottom-24 h-72 w-72 text-white/5">
          <path fill="currentColor" d="M10 190C10 90 70 20 190 10C190 110 120 180 10 190Z" />
        </svg>

        <Link
          to="/"
          aria-label="Sibol, go to Dashboard"
          className="relative mx-1 mb-6 flex items-center gap-3 rounded-xl px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-200"
        >
          <SibolMark aria-hidden="true" className="h-10 w-10" />
          <span className="text-2xl font-bold tracking-tight text-white">Sibol</span>
        </Link>

        <nav aria-label="Main" className="relative flex flex-1 flex-col gap-1 overflow-y-auto">
          {MAIN_ITEMS.map((item) => (
            <SidebarLink key={item.key} item={item} active={section === item.key} count={item.key === 'dashboard' ? attentionCount : 0} />
          ))}

          {isSuperAdmin && (
            <>
              <p className="mb-1.5 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-green-300">Manage</p>
              {MANAGE_ITEMS.map((item) => (
                <SidebarLink key={item.key} item={item} active={section === item.key} count={0} />
              ))}
            </>
          )}
        </nav>

        <div className="relative mt-4 border-t border-white/15 pt-3">
          <Link
            to="/change-password"
            className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-200"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-900">
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-white">{user.name}</span>
              <span className="block text-sm text-green-200">{roleName} · Change password</span>
            </span>
            <AppIcon name="key" className="h-4 w-4 text-green-200" />
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-green-100 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-200"
          >
            <AppIcon name="log-out" />
            Log out
          </button>
        </div>
      </aside>

      {/* Phone and tablet: slim top bar. */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-[#f7f6f1]/95 px-3 backdrop-blur lg:hidden print:hidden">
        <Link to="/" aria-label="Sibol, go to Dashboard" className="flex items-center gap-2.5 rounded-xl px-1 py-1">
          <SibolMark aria-hidden="true" className="h-10 w-10" />
          <span className="text-2xl font-bold tracking-tight text-green-900">Sibol</span>
        </Link>
        <button
          type="button"
          onClick={() => setSheet('account')}
          aria-label={`Account: ${user.name}`}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-green-900 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
        >
          {initials(user.name)}
        </button>
      </header>

      <main className="px-4 pb-28 pt-5 lg:px-8 lg:pb-14 lg:pt-8 print:p-0">
        <div className="mx-auto max-w-6xl print:max-w-none">
          {/* Keeps the menu on screen while a page's code is still loading. */}
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Phone and tablet: tab bar within thumb reach. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-stone-200 bg-white px-1 pb-[max(12px,env(safe-area-inset-bottom))] pt-1.5 lg:hidden print:hidden"
      >
        {MAIN_ITEMS.map((item) => (
          <TabLink key={item.key} item={item} active={section === item.key && sheet !== 'more'} count={item.key === 'dashboard' ? attentionCount : 0} />
        ))}
        {isSuperAdmin && (
          <button type="button" onClick={() => setSheet('more')} className={tabClass(sheet === 'more' || MANAGE_ITEMS.some((item) => item.key === section))}>
            <span className={tabPillClass(sheet === 'more' || MANAGE_ITEMS.some((item) => item.key === section))}>
              <AppIcon name="menu" />
            </span>
            More
          </button>
        )}
      </nav>

      {sheet === 'more' && (
        <Modal title="More" onClose={closeSheet}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-600">Manage</p>
          <ul>
            {MANAGE_ITEMS.map((item) => (
              <li key={item.key}>
                <SheetLink to={item.to} icon={item.icon} label={item.label} onClick={closeSheet} />
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-stone-200 pt-3">
            <SheetLink to="/change-password" icon="key" label="Change password" detail={`${user.name} · ${roleName}`} onClick={closeSheet} />
            <button
              type="button"
              onClick={logout}
              className="flex min-h-[56px] w-full items-center gap-4 rounded-xl px-1 text-left text-[17px] font-medium text-stone-900 hover:bg-stone-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                <AppIcon name="log-out" />
              </span>
              Log out
            </button>
          </div>
        </Modal>
      )}

      {sheet === 'account' && (
        <Modal title={user.name} onClose={closeSheet}>
          <p className="-mt-2 mb-3 text-[15px] text-stone-600">
            {roleName} · {user.email}
          </p>
          <SheetLink to="/change-password" icon="key" label="Change password" onClick={closeSheet} />
          <button type="button" onClick={logout} className={`mt-3 w-full ${btnSecondary}`}>
            <AppIcon name="log-out" />
            Log out
          </button>
        </Modal>
      )}
    </div>
  )
}

function SidebarLink({ item, active, count }) {
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'flex min-h-[44px] items-center gap-3 rounded-xl bg-[#f7f6f1] px-3 text-[15px] font-semibold text-green-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-200'
          : 'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-green-100 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-200'
      }
    >
      <AppIcon name={item.icon} />
      {item.label}
      {count > 0 && (
        <span
          className={
            active
              ? 'ml-auto min-w-[24px] rounded-full bg-green-900 px-1.5 text-center text-[13px] font-bold leading-6 text-white'
              : 'ml-auto min-w-[24px] rounded-full bg-[#f7f6f1] px-1.5 text-center text-[13px] font-bold leading-6 text-green-950'
          }
        >
          {count}
          <span className="sr-only"> {attentionLabel(count)}</span>
        </span>
      )}
    </Link>
  )
}

const tabClass = (active) =>
  active
    ? 'flex min-h-[52px] flex-1 flex-col items-center gap-1 rounded-xl text-xs font-bold text-green-900'
    : 'flex min-h-[52px] flex-1 flex-col items-center gap-1 rounded-xl text-xs font-medium text-stone-600'

const tabPillClass = (active) =>
  active
    ? 'relative flex h-8 w-[60px] items-center justify-center rounded-full bg-green-100'
    : 'relative flex h-8 w-[60px] items-center justify-center rounded-full'

function TabLink({ item, active, count }) {
  return (
    <Link to={item.to} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
      <span className={tabPillClass(active)}>
        <AppIcon name={item.icon} />
        {count > 0 && (
          <span className="absolute -top-1 right-1.5 min-w-[20px] rounded-full bg-green-900 px-1 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-white">
            {count}
            <span className="sr-only"> {attentionLabel(count)}</span>
          </span>
        )}
      </span>
      {item.label}
    </Link>
  )
}

function SheetLink({ to, icon, label, detail, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex min-h-[56px] items-center gap-4 rounded-xl px-1 hover:bg-stone-50">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-800">
        <AppIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-medium text-stone-900">{label}</span>
        {detail && <span className="block truncate text-sm text-stone-600">{detail}</span>}
      </span>
      <AppIcon name="chevron-right" className="h-5 w-5 text-stone-600" />
    </Link>
  )
}
