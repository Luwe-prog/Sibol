import { useCallback, useEffect, useState } from 'react'
import api, { readError } from '../api/client.js'

// Loads one GET endpoint. Pass null as the url to skip the request.
// While a new url loads, the previous data stays available so the screen does not flash empty.
export default function useFetch(url) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(url))
  // Bumped by reload() to run the request again.
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!url) return undefined

    // If the url changes before the response arrives, the late response is ignored.
    let current = true

    api
      .get(url)
      .then((response) => {
        if (!current) return
        setData(response.data)
        setError('')
      })
      .catch((err) => {
        if (current) setError(readError(err).message)
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    return () => {
      current = false
    }
  }, [url, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return { data, error, loading, reload }
}
