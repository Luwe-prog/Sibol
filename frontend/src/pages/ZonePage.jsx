import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ImportReadingsModal from '../components/ImportReadingsModal.jsx'
import ReadingHistory from '../components/ReadingHistory.jsx'
import TrendCharts from '../components/TrendCharts.jsx'
import { ErrorAlert, InactiveBadge, Loading, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { describeEstimate } from '../lib/estimate.js'
import { formatNumber } from '../lib/format.js'
import { ENVIRONMENT_LABEL } from '../lib/status.js'
import { btnPrimary, btnSecondary, linkClass } from '../lib/styles.js'

export default function ZonePage() {
  const { zoneId } = useParams()
  const { data, error, loading, reload } = useFetch(`/zones/${zoneId}`)
  const [importing, setImporting] = useState(false)
  // Bumped after an import, to make the charts and the history load again.
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) return <Loading />
  if (error) return <ErrorAlert>{error}</ErrorAlert>

  const zone = data.zone
  const crop = zone.crop
  const canEnter = zone.is_active && zone.farm.is_active
  const estimate = describeEstimate(zone.watering_estimate)

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link to={`/farms/${zone.farm.id}`} className={linkClass}>
          ← {zone.farm.name}
        </Link>
      </p>

      <PageHeader
        title={zone.name}
        subtitle={`${crop.name} · ${ENVIRONMENT_LABEL[zone.environment]} · ${formatNumber(zone.water_factor)} L per point`}
      >
        {canEnter ? (
          <>
            <Link to={`/zones/${zone.id}/readings/new`} className={btnPrimary}>
              Enter reading
            </Link>
            <button type="button" className={btnSecondary} onClick={() => setImporting(true)}>
              Import CSV
            </button>
          </>
        ) : (
          <InactiveBadge />
        )}
      </PageHeader>

      {zone.is_active && (
        <div className="mb-8 rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-600">Next watering</p>
          {estimate.short && <p className="mt-1 text-xl font-semibold text-stone-900">{estimate.short}</p>}
          <p className="mt-1 text-sm text-stone-600">{estimate.detail}</p>
          {estimate.due && (
            <p className="mt-1 text-sm text-stone-500">
              This is an estimate from past readings. Rain, heat or a change in watering will shift it.
            </p>
          )}
        </div>
      )}

      <div className="space-y-8">
        <TrendCharts key={`trend-${zone.id}-${refreshKey}`} zoneId={zone.id} crop={crop} />

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">History</h2>
          <ReadingHistory key={`history-${zone.id}-${refreshKey}`} url={`/zones/${zone.id}/readings`} />
        </section>
      </div>

      {importing && (
        <ImportReadingsModal
          zone={zone}
          onClose={() => setImporting(false)}
          onImported={() => {
            setRefreshKey((current) => current + 1)
            reload()
          }}
        />
      )}
    </div>
  )
}
