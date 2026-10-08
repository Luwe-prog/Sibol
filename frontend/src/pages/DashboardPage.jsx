import { Link } from 'react-router-dom'
import { AppIcon } from '../components/icons.jsx'
import { ErrorAlert, Loading, PageHeader, StatusBadge, Badge } from '../components/ui.jsx'
import ZoneCard from '../components/ZoneCard.jsx'
import { useAuth } from '../context/useAuth.js'
import useFetch from '../hooks/useFetch.js'
import { daysSince, formatNumber, formatRelative } from '../lib/format.js'
import { FLAG, MOISTURE_STATUS, NO_READINGS } from '../lib/status.js'
import { btnPrimary, btnPrimarySmall, btnSecondary, cardClass } from '../lib/styles.js'

// Too Dry first: an underwatered zone is the most urgent.
const ATTENTION_ORDER = { too_dry: 0, too_wet: 1 }

const attentionRank = (zone) => (zone.needs_attention ? ATTENTION_ORDER[zone.latest_reading.moisture_status] : 2)

// What to do about a zone on the "Needs attention" list.
const instruction = (zone) => {
  const latest = zone.latest_reading
  if (zone.is_stale) return { text: 'Take a new reading. This status may be out of date.', tone: 'text-stone-800', box: 'bg-stone-100 text-stone-900' }
  const status = MOISTURE_STATUS[latest.moisture_status]
  return latest.moisture_status === 'too_dry'
    ? { text: `Water now: apply about ${formatNumber(latest.recommended_liters)} L`, tone: status.text, box: status.soft }
    : { text: 'Hold off watering and check drainage', tone: status.text, box: status.soft }
}

export default function DashboardPage() {
  const { isSuperAdmin } = useAuth()
  const { data, error, loading, reload } = useFetch('/dashboard')

  if (loading) return <Loading />
  if (error) return <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

  const { zones, summary } = data

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
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Dashboard" subtitle={isSuperAdmin ? 'Every active zone on every farm.' : 'Every active zone on your farms.'}>
        <button type="button" className={btnSecondary} onClick={reload}>
          <AppIcon name="refresh" />
          Refresh
        </button>
      </PageHeader>

      {zones.length === 0 ? (
        <GettingStarted isSuperAdmin={isSuperAdmin} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatTile status={MOISTURE_STATUS.too_dry} value={summary.too_dry} />
            <StatTile status={MOISTURE_STATUS.optimal} value={summary.optimal} />
            <StatTile status={MOISTURE_STATUS.too_wet} value={summary.too_wet} />
            <StatTile status={NO_READINGS} value={summary.no_readings} />
          </div>

          <NeedsAttention zones={attention} />

          {farms.map((farm) => (
            <section key={farm.id}>
              <h2 className="mb-3 text-lg font-semibold text-green-950">
                <Link to={`/farms/${farm.id}`} className="hover:underline">
                  {farm.name}
                </Link>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
                {farm.zones.map((zone) => (
                  <ZoneCard key={zone.id} zone={zone} showAdvice />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}

function StatTile({ status, value }) {
  return (
    <div className={`rounded-2xl border p-4 lg:p-5 ${status.tile}`}>
      <p className={`flex items-center gap-2 text-sm font-semibold ${status.text}`}>
        <AppIcon name={status.icon} />
        {status.label}
      </p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-[32px] font-semibold leading-9 tracking-tight tabular-nums lg:text-[40px] lg:leading-[44px] ${status.num}`}>{value}</span>
        <span className={`text-sm ${status.text}`}>{value === 1 ? 'zone' : 'zones'}</span>
      </p>
    </div>
  )
}

function AttentionBadges({ zone }) {
  const latest = zone.latest_reading
  return (
    <span className="flex flex-wrap gap-1.5">
      {zone.needs_attention && <StatusBadge status={MOISTURE_STATUS[latest.moisture_status]} />}
      {zone.is_stale && (
        <Badge className={FLAG.stale.badge} icon={FLAG.stale.icon}>
          {FLAG.stale.label(daysSince(latest.recorded_at))}
        </Badge>
      )}
    </span>
  )
}

function NeedsAttention({ zones }) {
  return (
    <section className={`overflow-hidden ${cardClass}`}>
      <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold text-green-950">Needs attention</h2>
        {zones.length > 0 && <span className="rounded-full bg-green-900 px-2.5 text-[13px] font-bold leading-6 text-white">{zones.length}</span>}
      </div>

      {zones.length === 0 ? (
        <p className="flex items-center gap-3 px-4 py-4 text-[15px] text-stone-800 sm:px-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-green-300 bg-green-50 text-green-800">
            <AppIcon name="optimal" />
          </span>
          <span>
            <span className="font-semibold">Nothing needs attention.</span> No zone is too dry or too wet, and all readings are recent.
          </span>
        </p>
      ) : (
        <>
          {/* Laptop: a table. */}
          <table className="hidden w-full text-left text-sm lg:table">
            <thead className="bg-stone-50">
              <tr>
                {['Status', 'Zone', 'Soil', 'Last reading', 'What to do'].map((heading) => (
                  <th key={heading} scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 first:pl-5">
                    {heading}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => {
                const todo = instruction(zone)
                return (
                  <tr key={zone.id} className="hover:bg-stone-50">
                    <td className="border-t border-stone-200 px-3 py-3 pl-5 align-middle">
                      <AttentionBadges zone={zone} />
                    </td>
                    <td className="border-t border-stone-200 px-3 py-3 align-middle">
                      <Link to={`/zones/${zone.id}`} className="text-[15px] font-semibold text-green-950 hover:underline">
                        {zone.name}
                      </Link>
                      <span className="block text-stone-600">
                        {zone.farm.name} · {zone.crop.name}
                      </span>
                    </td>
                    <td className="border-t border-stone-200 px-3 py-3 align-middle text-[15px] font-semibold tabular-nums text-stone-900">
                      {formatNumber(zone.latest_reading.soil_moisture)}%
                    </td>
                    <td className="whitespace-nowrap border-t border-stone-200 px-3 py-3 align-middle text-stone-700">
                      {formatRelative(zone.latest_reading.recorded_at)}
                    </td>
                    <td className={`border-t border-stone-200 px-3 py-3 align-middle text-[15px] font-semibold ${todo.tone}`}>{todo.text}</td>
                    <td className="border-t border-stone-200 px-3 py-3 pr-5 text-right align-middle">
                      <Link to={`/zones/${zone.id}/readings/new`} className={btnPrimarySmall}>
                        <AppIcon name="plus" className="h-4 w-4" />
                        Enter reading
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Phone: one card per zone, with the instruction and a full-width button. */}
          <ul className="space-y-3 p-3 lg:hidden">
            {zones.map((zone) => {
              const todo = instruction(zone)
              const border = zone.needs_attention ? MOISTURE_STATUS[zone.latest_reading.moisture_status].card : 'border-orange-300'
              return (
                <li key={zone.id} className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 ${border}`}>
                  <AttentionBadges zone={zone} />
                  <div>
                    <Link to={`/zones/${zone.id}`} className="text-[17px] font-semibold text-green-950 hover:underline">
                      {zone.name}
                    </Link>
                    <p className="text-sm text-stone-600">
                      {zone.farm.name} · {zone.crop.name} · soil {formatNumber(zone.latest_reading.soil_moisture)}% ·{' '}
                      {formatRelative(zone.latest_reading.recorded_at)}
                    </p>
                  </div>
                  <p className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-base font-semibold ${todo.box}`}>{todo.text}</p>
                  <Link to={`/zones/${zone.id}/readings/new`} className={`w-full ${btnPrimary}`}>
                    <AppIcon name="plus" />
                    Enter reading
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

// Shown when there are no zones yet: the steps to get to a first reading.
function GettingStarted({ isSuperAdmin }) {
  const steps = isSuperAdmin
    ? [
        { icon: 'sprout', title: 'Create a farm', text: 'One farm is one site, such as a school rooftop.', to: '/farms', action: 'Go to Farms' },
        { icon: 'users', title: 'Add an account', text: 'Create an Admin and assign them to the farm.', to: '/admin/accounts', action: 'Go to Accounts' },
        { icon: 'plus', title: 'Add a zone', text: 'Open the farm and add a bed or rack with its crop.', to: '/farms', action: 'Go to Farms' },
        { icon: 'droplet', title: 'Enter a reading', text: 'Type in soil moisture, temperature and humidity to get a status.' },
      ]
    : [
        { icon: 'sprout', title: 'Open your farm', text: 'If you see no farm, ask your Super Admin to assign you to one.', to: '/farms', action: 'Go to Farms' },
        { icon: 'plus', title: 'Add a zone', text: 'Add a bed or rack with its crop.' },
        { icon: 'droplet', title: 'Enter a reading', text: 'Type in soil moisture, temperature and humidity to get a status.' },
      ]

  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <h2 className="text-lg font-semibold text-green-950">Let’s get your first zone set up</h2>
      <p className="mt-1 text-[15px] text-stone-600">The dashboard shows each zone’s status once it has a reading. Here is how to get there.</p>
      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-800">
              <AppIcon name={step.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-stone-900">
                {index + 1}. {step.title}
              </p>
              <p className="text-[15px] text-stone-600">{step.text}</p>
              {step.to && (
                <Link to={step.to} className="mt-1 inline-flex min-h-[44px] items-center font-semibold text-green-800 underline underline-offset-4 hover:text-green-950">
                  {step.action}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
