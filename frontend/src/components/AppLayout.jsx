import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/useAuth.js'
import { initials } from '../lib/format.js'
import './app.css'
import { AppIcon, SibolMark } from './icons.jsx'
import { Loading, Modal } from './ui.jsx'

// The frame around every signed-in screen: a green sidebar on laptops, and a top bar with
// bottom tabs on phones. Layout and styles come from the Figma Make design (components/app.css).

const MAIN_ITEMS = [
  { key: 'dashboard', to: '/', label: 'Dashboard', icon: 'dashboard' },
  { key: 'farms', to: '/farms', label: 'Farms', icon: 'leaf' },
  { key: 'report', to: '/reports/water', label: 'Water report', icon: 'report' },
]

// Super Admin only.
const MANAGE_ITEMS = [
  { key: 'accounts', to: '/admin/accounts', label: 'Accounts', icon: 'users' },
  { key: 'crops', to: '/admin/crops', label: 'Crop library', icon: 'sprout' },
  { key: 'activity', to: '/admin/activity', label: 'Activity log', icon: 'history' },
]

// Which menu item the current page belongs to. Zone and reading pages sit under Farms.
const sectionOf = (pathname) => {
  if (pathname === '/') return 'dashboard'
  if (pathname.startsWith('/reports')) return 'report'
  if (pathname.startsWith('/admin/accounts')) return 'accounts'
  if (pathname.startsWith('/admin/crops')) return 'crops'
  if (pathname.startsWith('/admin/activity')) return 'activity'
  return 'farms'
}

const attentionLabel = (count) => `${count === 1 ? 'zone needs' : 'zones need'} attention`

export default function AppLayout() {
  const { user, isSuperAdmin, logout } = useAuth()
  const { pathname } = useLocation()
  // Zones that are too dry, too wet, or stale. Shown as a badge on the Dashboard item from every page.
  const [attentionCount, setAttentionCount] = useState(0)
  // Phone only: the "More" sheet.
  const [moreOpen, setMoreOpen] = useState(false)

  const section = sectionOf(pathname)
  const roleName = isSuperAdmin ? 'Super Admin' : 'Admin'
  const closeMore = () => setMoreOpen(false)

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

  const navLink = (item, onClick) => (
    <Link
      key={item.key}
      to={item.to}
      onClick={onClick}
      className={section === item.key ? 'nav-item active' : 'nav-item'}
      aria-current={section === item.key ? 'page' : undefined}
    >
      <AppIcon name={item.icon} />
      <span>{item.label}</span>
      {item.key === 'dashboard' && attentionCount > 0 && (
        <span className="nav-count">
          {attentionCount}
          <span className="sr-only"> {attentionLabel(attentionCount)}</span>
        </span>
      )}
    </Link>
  )

  const brand = (
    <Link to="/" className="brand" aria-label="Sibol, go to Dashboard">
      <SibolMark aria-hidden="true" />
      <span>
        Sibol<span className="brand-dot">.</span>
      </span>
    </Link>
  )

  return (
    <div className="sibol-app">
      <aside className="sidebar">
        {brand}
        <div className="sidebar-divider" />
        <nav className="main-nav" aria-label="Main">
          {MAIN_ITEMS.map((item) => navLink(item))}
          {isSuperAdmin && (
            <>
              <p className="nav-label">MANAGE</p>
              {MANAGE_ITEMS.map((item) => navLink(item))}
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-info">
            <span className="avatar">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{roleName}</span>
            </div>
          </div>
          <Link to="/change-password" className="sidebar-action">
            <AppIcon name="key" />
            Change password
          </Link>
          <button type="button" className="sidebar-action" onClick={logout}>
            <AppIcon name="log-out" />
            Log out
          </button>
        </div>
        <span className="sidebar-decoration" aria-hidden="true">
          <AppIcon name="sprout" />
        </span>
      </aside>

      <div className="mobile-header">
        {brand}
        <button type="button" className="avatar" onClick={() => setMoreOpen(true)} aria-label={`Account: ${user.name}`}>
          {initials(user.name)}
        </button>
      </div>

      <div className="workspace">
        <div className="topline">
          <span>
            <AppIcon name="sprout" /> A little care. A little growth.
          </span>
          <span className="role-label">{roleName.toUpperCase()} WORKSPACE</span>
        </div>
        <main className="main-content">
          {/* Keeps the menu on screen while a page's code is still loading. */}
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="app-footer">
          <span>Sibol · Growing with care</span>
          <span>All readings are entered by hand.</span>
        </footer>
      </div>

      <nav className="mobile-tabs" aria-label="Main">
        {MAIN_ITEMS.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={section === item.key && !moreOpen ? 'active' : undefined}
            aria-current={section === item.key ? 'page' : undefined}
          >
            <AppIcon name={item.icon} />
            {item.label}
            {item.key === 'dashboard' && attentionCount > 0 && (
              <span className="tab-count">
                {attentionCount}
                <span className="sr-only"> {attentionLabel(attentionCount)}</span>
              </span>
            )}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={moreOpen || MANAGE_ITEMS.some((item) => item.key === section) ? 'active' : undefined}
        >
          <AppIcon name="menu" />
          More
        </button>
      </nav>

      {moreOpen && (
        <Modal title="More" onClose={closeMore}>
          <p className="muted" style={{ marginBottom: 12 }}>
            {user.name} · {roleName}
          </p>
          <div className="more-links">
            {isSuperAdmin && MANAGE_ITEMS.map((item) => navLink(item, closeMore))}
            <Link to="/change-password" className="nav-item" onClick={closeMore}>
              <AppIcon name="key" />
              <span>Change password</span>
            </Link>
            <button type="button" className="nav-item" onClick={logout}>
              <AppIcon name="log-out" />
              <span>Log out</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
