import { Link } from 'react-router-dom'
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import useFetch from '../hooks/useFetch.js'
import { describeEstimate } from '../lib/estimate.js'
import { formatDateTime, formatNumber, formatRelative } from '../lib/format.js'
import { ENVIRONMENT_LABEL, HUMIDITY_STATUS, MOISTURE_STATUS, TEMP_STATUS } from '../lib/status.js'
import { btnPrimary, btnSecondary, btnSmall, linkClass } from '../lib/styles.js'

// Too Dry first: an underwatered zone is the most urgent.
const ATTENTION_ORDER = { too_dry: 0, too_wet: 1 }

export default function DashboardPage() {
  const { isSuperAdmin } = useAuth()
  const { data, error, loading, reload } = useFetch('/dashboard')

  if (loading) return <Loading />
  if (error) return <ErrorAlert>{error}</ErrorAlert>

  const { zones, summary, stale_after_days: staleAfterDays } = data

  const attention = zones
    .filter((zone) => zone.needs_attention || zone.is_stale)
    .sort((a, b) => attentionRank(a) - attentionRank(b) || a.name.localeCompare(b.name))

  // Group the zone cards under their farm.
  const farms = []
  zones.forEach((zone) => {
    let group = farms.find((farm) => farm.id === zone.farm.id)
    if (!group) {
      group = { id: zone.farm.id, name: zone.farm.name, zones: [] }
      farms.push(group)
    }
    group.zones.push(zone)
  })
  farms.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={isSuperAdmin ? 'Every active zone on every farm.' : 'Every active zone on your farms.'}>
        <button type="button" className={btnSecondary} onClick={reload}>
          Refresh
        </button>
      </PageHeader>

      {zones.length === 0 ? (
        <EmptyState>
          No active zones yet.{' '}
          <Link to="/farms" className={linkClass}>
            Go to Farms
          </Link>{' '}
          to add one.
        </EmptyState>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Too Dry" value={summary.too_dry} dot={MOISTURE_STATUS.too_dry.dot} />
            <StatTile label="Optimal" value={summary.optimal} dot={MOISTURE_STATUS.optimal.dot} />
            <StatTile label="Too Wet" value={summary.too_wet} dot={MOISTURE_STATUS.too_wet.dot} />
            <StatTile label="No readings yet" value={summary.no_readings} dot="bg-stone-400" />
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-stone-900">Needs attention</h2>
            {attention.length === 0 ? (
              <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-green-900">
                Nothing needs attention. No zone is too dry or too wet, and all readings are recent.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
                {attention.map((zone) => (
                  <AttentionRow key={zone.id} zone={zone} staleAfterDays={staleAfterDays} />
                ))}
              </ul>
            )}
          </section>

          {farms.map((farm) => (
            <section key={farm.id} className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-stone-900">
                <Link to={`/farms/${farm.id}`} className="hover:text-green-700">
                  {farm.name}
                </Link>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {farm.zones.map((zone) => (
                  <ZoneCard key={zone.id} zone={zone} staleAfterDays={staleAfterDays} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}

function attentionRank(zone) {
  const status = zone.latest_reading?.moisture_status
  return zone.needs_attention ? ATTENTION_ORDER[status] : 2
}

function StatTile({ label, value, dot }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="flex items-center gap-2 text-sm text-stone-600">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-stone-900">{value}</p>
    </div>
  )
}

function StaleBadge({ staleAfterDays }) {
  return <Badge className="bg-orange-100 text-orange-800">No reading for {staleAfterDays}+ days</Badge>
}

function AttentionRow({ zone, staleAfterDays }) {
  const latest = zone.latest_reading
  const status = MOISTURE_STATUS[latest.moisture_status]

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <Link to={`/zones/${zone.id}`} className="font-medium text-stone-900 hover:text-green-700">
            {zone.name}
          </Link>
          {zone.needs_attention && <Badge className={status.badge}>{status.label}</Badge>}
          {zone.is_stale && <StaleBadge staleAfterDays={staleAfterDays} />}
        </p>
        <p className="text-sm text-stone-600">
          {zone.farm.name} · {zone.crop.name} · soil moisture {formatNumber(latest.soil_moisture)}% ·{' '}
          {formatRelative(latest.recorded_at)}
        </p>
        {zone.needs_attention && !zone.is_stale && (
          <p className="mt-1 text-sm text-stone-800">
            {latest.moisture_status === 'too_dry'
              ? `Water now: apply about ${formatNumber(latest.recommended_liters)} L.`
              : 'Hold off watering and check drainage.'}
          </p>
        )}
        {zone.is_stale && (
          <p className="mt-1 text-sm text-stone-800">This status may be out of date. Take a new reading.</p>
        )}
      </div>
      <Link to={`/zones/${zone.id}/readings/new`} className={btnSmall}>
        Enter reading
      </Link>
    </li>
  )
}

function ZoneCard({ zone, staleAfterDays }) {
  const latest = zone.latest_reading
  const status = latest ? MOISTURE_STATUS[latest.moisture_status] : null
  const estimate = describeEstimate(zone.watering_estimate)

  return (
    <div className={`flex flex-col rounded-xl border p-4 ${status ? status.panel : 'border-stone-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <Link to={`/zones/${zone.id}`} className="font-semibold text-stone-900 hover:underline">
          {zone.name}
        </Link>
        {zone.is_stale && <StaleBadge staleAfterDays={staleAfterDays} />}
      </div>
      <p className="text-sm text-stone-600">
        {zone.crop.name} · {ENVIRONMENT_LABEL[zone.environment]}
      </p>

      {latest ? (
        <>
          <p className={`mt-3 text-2xl font-semibold ${status.heading}`}>{status.label}</p>
          <p className="text-sm text-stone-700">
            Soil {formatNumber(latest.soil_moisture)}% · {formatNumber(latest.temperature)} °C · humidity{' '}
            {formatNumber(latest.humidity)}%
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {latest.temp_status !== 'optimal' && (
              <Badge className={TEMP_STATUS[latest.temp_status].badge}>{TEMP_STATUS[latest.temp_status].label}</Badge>
            )}
            {latest.humidity_status !== 'optimal' && (
              <Badge className={HUMIDITY_STATUS[latest.humidity_status].badge}>
                Humidity {HUMIDITY_STATUS[latest.humidity_status].label}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-stone-600" title={formatDateTime(latest.recorded_at)}>
            Updated {formatRelative(latest.recorded_at)}
          </p>
          {/* A Too Dry card already says "water now", so the estimate would only repeat it. */}
          {latest.moisture_status !== 'too_dry' && estimate?.short && (
            <p className="mt-1 text-sm font-medium text-stone-800">{estimate.short}</p>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 text-2xl font-semibold text-stone-500">No readings</p>
          <p className="text-sm text-stone-600">Take the first reading to get a status.</p>
        </>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Link to={`/zones/${zone.id}/readings/new`} className={btnPrimary}>
          Enter reading
        </Link>
        {latest && (
          <Link to={`/readings/${latest.id}`} className={btnSmall}>
            Advice
          </Link>
        )}
      </div>
    </div>
  )
}
