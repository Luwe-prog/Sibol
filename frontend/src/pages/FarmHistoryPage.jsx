import { useParams } from 'react-router-dom'
import ReadingHistory from '../components/ReadingHistory.jsx'
import { ErrorAlert, Loading, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'

// Every reading of every zone in one farm.
export default function FarmHistoryPage() {
  const { farmId } = useParams()
  const { data, error, loading } = useFetch(`/farms/${farmId}`)

  if (loading) return <Loading />
  if (error) return <ErrorAlert>{error}</ErrorAlert>

  const farm = data.farm

  return (
    <div>
      <PageHeader title="Farm history" back={{ to: `/farms/${farm.id}`, label: farm.name }} subtitle={`All readings across the zones of ${farm.name}.`} />

      <ReadingHistory key={farm.id} url={`/farms/${farm.id}/readings`} zones={farm.zones} />
    </div>
  )
}
