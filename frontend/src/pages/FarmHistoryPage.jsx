import { Link, useParams } from 'react-router-dom'
import ReadingHistory from '../components/ReadingHistory.jsx'
import { ErrorAlert, Loading, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { linkClass } from '../lib/styles.js'

// Every reading of every zone in one farm.
export default function FarmHistoryPage() {
  const { farmId } = useParams()
  const { data, error, loading } = useFetch(`/farms/${farmId}`)

  if (loading) return <Loading />
  if (error) return <ErrorAlert>{error}</ErrorAlert>

  const farm = data.farm

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link to={`/farms/${farm.id}`} className={linkClass}>
          ← {farm.name}
        </Link>
      </p>

      <PageHeader title="Farm history" subtitle={`All readings across the zones of ${farm.name}.`} />

      <ReadingHistory key={farm.id} url={`/farms/${farm.id}/readings`} zones={farm.zones} />
    </div>
  )
}
