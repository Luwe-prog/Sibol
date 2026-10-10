import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../context/useAuth.js'
import { GuestOnly, RequireAuth, RequirePasswordChanged, RequireSuperAdmin } from './RouteGuards.jsx'

const admin = { id: 2, name: 'Ana', role: 'admin', must_change_password: false }
const superAdmin = { id: 1, name: 'Boss', role: 'super_admin', must_change_password: false }

// The same nesting as App.jsx, with plain text standing in for the pages.
function renderAt(path, user, loading = false) {
  const auth = { user, loading, isSuperAdmin: user?.role === 'super_admin' }

  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<p>login page</p>} />
          </Route>
          <Route element={<RequireAuth landing={<p>landing page</p>} />}>
            <Route path="/change-password" element={<p>change password page</p>} />
            <Route element={<RequirePasswordChanged />}>
              <Route path="/" element={<p>dashboard page</p>} />
              <Route element={<RequireSuperAdmin />}>
                <Route path="/admin/crops" element={<p>crop library page</p>} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('route guards', () => {
  it('shows the landing page at "/" to a visitor who is not logged in', () => {
    renderAt('/', null)
    expect(screen.getByText('landing page')).toBeInTheDocument()
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })

  it('sends a visitor who is not logged in to the login page from anywhere else', () => {
    renderAt('/admin/crops', null)
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('waits while a saved login is still being checked', () => {
    renderAt('/', null, true)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
  })

  it('sends a logged-in user away from the login page', () => {
    renderAt('/login', admin)
    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })

  it('holds a user with a temporary password on the change-password page', () => {
    renderAt('/', { ...admin, must_change_password: true })
    expect(screen.getByText('change password page')).toBeInTheDocument()
  })

  it('keeps an Admin out of Super Admin pages', () => {
    renderAt('/admin/crops', admin)
    expect(screen.getByText('dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('crop library page')).not.toBeInTheDocument()
  })

  it('lets a Super Admin into Super Admin pages', () => {
    renderAt('/admin/crops', superAdmin)
    expect(screen.getByText('crop library page')).toBeInTheDocument()
  })
})
