import axios from 'axios'

const TOKEN_KEY = 'sibol_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// Sanctum Bearer tokens: no cookies, no CSRF, no withCredentials.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// AuthContext registers a handler here so an expired or revoked session sends the user back to login.
let onSessionEnded = () => {}
export const setSessionEndedHandler = (handler) => {
  onSessionEnded = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code
    const isLoginRequest = error.config?.url === '/login'

    if (!isLoginRequest && (status === 401 || code === 'account_deactivated')) {
      clearToken()
      onSessionEnded()
    }
    return Promise.reject(error)
  },
)

// Turns an API error into one message plus per-field messages for forms.
export const readError = (error) => {
  if (!error.response) {
    return { message: 'Cannot reach the server. Check that the backend is running.', fields: {} }
  }
  const { message, errors } = error.response.data ?? {}
  const fields = {}
  Object.entries(errors ?? {}).forEach(([field, messages]) => {
    fields[field] = messages[0]
  })
  return { message: message ?? 'Something went wrong. Please try again.', fields }
}

// Downloads a file from the API. A plain link would not work, because the Bearer token must be sent.
export const downloadFile = async (url, params, fallbackName) => {
  const response = await api.get(url, { params, responseType: 'blob' })
  const named = /filename="?([^";]+)"?/.exec(response.headers['content-disposition'] ?? '')

  const link = document.createElement('a')
  link.href = URL.createObjectURL(response.data)
  link.download = named ? named[1] : fallbackName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

export default api
