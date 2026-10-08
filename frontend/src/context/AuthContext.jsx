import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { clearToken, getToken, setSessionEndedHandler, setToken } from '../api/client.js'
import { AuthContext } from './useAuth.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // True until we know whether a saved token is still valid.
  const [loading, setLoading] = useState(Boolean(getToken()))

  useEffect(() => {
    setSessionEndedHandler(() => setUser(null))

    if (!getToken()) return

    api
      .get('/me')
      .then((response) => setUser(response.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await api.post('/login', { email, password })
    setToken(response.data.token)
    setUser(response.data.user)
    return response.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      // The token is cleared locally either way.
    }
    clearToken()
    setUser(null)
  }, [])

  const changePassword = useCallback(async (currentPassword, password, passwordConfirmation) => {
    const response = await api.post('/change-password', {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    })
    setUser(response.data.user)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isSuperAdmin: user?.role === 'super_admin',
      login,
      logout,
      changePassword,
    }),
    [user, loading, login, logout, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
