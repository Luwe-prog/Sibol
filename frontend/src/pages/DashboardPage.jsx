import { Link } from 'react-router-dom'
import { AppIcon } from '../components/icons.jsx'
import { Badge, ErrorAlert, Loading, PageHeader, StatusBadge } from '../components/ui.jsx'
import ZoneCard from '../components/ZoneCard.jsx'
import { useAuth } from '../context/useAuth.js'
import useFetch from '../hooks/useFetch.js'
import { daysSince, formatNumber, formatRelative } from '../lib/format.js'
import { FLAG, MOISTURE_STATUS, NO_READINGS } from '../lib/status.js'
import { cardClass } from '../lib/styles.js'

// Too Dry first: an underwatered zone is the most urgent.
const ATTENTION_ORDER = { too_dry: 0, too_wet: 1 }

const attentionRank = (zone) => (zone.needs_attention ? ATTENTION_ORDER[zone.latest_reading.moisture_status] : 2)

// What to do about a zone on the "Needs attention" list.
const instruction = (zone) => {
  const latest = zone.latest_reading
  if (zone.is_stale) return { icon: 'clock', title: 'Take a new reading', detail: 'This status may be out of date' }
  return latest.moisture_status === 'too_dry'
    ? { icon: 'droplet', title: 'Water now', detail: `Apply about ${formatNumber(latest.recommended_liters)} L` }
    : { icon: 'too-wet', title: 'Hold off on watering', detail: 'Check drainage and let the soil dry' }
}

const TILES = [
  { key: 'too_dry', status: MOISTURE_STATUS.too_dry, note: 'Ready for a little water' },
  { key: 'optimal', status: MOISTURE_STATUS.optimal, note: 'Right where they should be' },
  { key: 'too_wet', status: MOISTURE_STATUS.too_wet, note: 'Let the soil rest' },
  { key: 'no_readings', status: NO_READINGS, note: 'Waiting for a first reading' },
]

const plural = (count, word) => `${count} ${count === 1 ? word : `${word}s`}`

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
    <>
      <PageHeader title="Dashboard" subtitle={isSuperAdmin ? 'Every active zone on every farm.' : 'Every active zone on your farms.'}>
        <button type="button" className="btn btn-secondary" onClick={reload}>
          <AppIcon name="refresh" />
          Refresh
        </button>
      </PageHeader>

      {zones.length === 0 ? (
        <GettingStarted isSuperAdmin={isSuperAdmin} />
      ) : (
        <>
          <div className="stat-grid">
            {TILES.map((tile, index) => (
              <section className={`card stat-card stat-${index}`} key={tile.key}>
                <div className="stat-top">
                  <span>{tile.status.label}</span>
                  <span className={`stat-icon tone-${index}`}>
                    <AppIcon name={tile.status.icon} />
                  </span>
                </div>
                <div className="stat-bottom">
                  <strong>{summary[tile.key]}</strong>
                  <span>{tile.note}</span>
                </div>
              </section>
            ))}
          </div>

          <section className="card attention-card">
            <div className="section-heading">
              <div className="section-title">
                <span className="attention-icon">
                  <AppIcon name="warning" />
                </span>
                <h2>Needs attention</h2>
                {attention.length > 0 && <span className="small-count">{attention.length}</span>}
              </div>
              <span className="section-helper">A little care goes a long way.</span>
            </div>

            {attention.length === 0 ? (
              <p className="attention-empty">
                <AppIcon name="optimal" />
                Nothing needs attention. No zone is too dry or too wet, and all readings are recent.
              </p>
            ) : (
              attention.map((zone) => {
                const latest = zone.latest_reading
                const todo = instruction(zone)
                return (
                  <div className="attention-row" key={zone.id}>
                    <div className="attention-zone">
                      <span className="attention-badges">
                        {zone.needs_attention && <StatusBadge status={MOISTURE_STATUS[latest.moisture_status]} />}
                        {zone.is_stale && (
                          <Badge className={FLAG.stale.badge} icon={FLAG.stale.icon}>
                            {FLAG.stale.label(daysSince(latest.recorded_at))}
                          </Badge>
                        )}
                      </span>
                      <strong>
                        <Link to={`/zones/${zone.id}`}>{zone.name}</Link>
                      </strong>
                      <span className="muted">
                        {zone.farm.name} <span className="dot-separator">·</span> {zone.crop.name}
                      </span>
                    </div>
                    <div className="attention-measurement">
                      <strong>
                        {formatNumber(latest.soil_moisture)}
                        <span>%</span>
                      </strong>
                      <span className="muted">Soil moisture</span>
                      <span className="reading-age">
                        <AppIcon name="clock" />
                        {formatRelative(latest.recorded_at)}
                      </span>
                    </div>
                    <div className="water-instruction">
                      <span className="water-icon">
                        <AppIcon name={todo.icon} />
                      </span>
                      <div>
                        <strong>{todo.title}</strong>
                        <span>{todo.detail}</span>
                      </div>
                    </div>
                    <Link to={`/zones/${zone.id}/readings/new`} className="btn btn-primary">
                      <AppIcon name="plus" />
                      Enter reading
                    </Link>
                  </div>
                )
              })
            )}
          </section>

          <div className="zones-heading">
            <h2>Your growing zones</h2>
            <span className="muted">
              {plural(zones.length, 'zone')} across {plural(farms.length, 'farm')}
            </span>
          </div>

          <div className="farm-zone-grid">
            {farms.map((farm) => (
              <section key={farm.id} className="farm-zone-group">
                <div className="farm-group-heading">
                  <span className="farm-heading-icon">
                    <AppIcon name="leaf" />
                  </span>
                  <h3>
                    <Link to={`/farms/${farm.id}`}>{farm.name}</Link>
                  </h3>
                  <span>{plural(farm.zones.length, 'zone')}</span>
                </div>
                {farm.zones.map((zone) => (
                  <ZoneCard key={zone.id} zone={zone} showAdvice />
                ))}
              </section>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// Shown when there are no zones yet: the steps to get to a first reading.
function GettingStarted({ isSuperAdmin }) {
  const steps = isSuperAdmin
    ? [
        { icon: 'leaf', title: 'Create a farm', text: 'One farm is one site, such as a school rooftop.', to: '/farms', action: 'Go to Farms' },
        { icon: 'users', title: 'Add an account', text: 'Create an Admin and assign them to the farm.', to: '/admin/accounts', action: 'Go to Accounts' },
        { icon: 'plus', title: 'Add a zone', text: 'Open the farm and add a bed or rack with its crop.', to: '/farms', action: 'Go to Farms' },
        { icon: 'droplet', title: 'Enter a reading', text: 'Type in soil moisture, temperature and humidity to get a status.' },
      ]
    : [
        { icon: 'leaf', title: 'Open your farm', text: 'If you see no farm, ask your Super Admin to assign you to one.', to: '/farms', action: 'Go to Farms' },
        { icon: 'plus', title: 'Add a zone', text: 'Add a bed or rack with its crop.' },
        { icon: 'droplet', title: 'Enter a reading', text: 'Type in soil moisture, temperature and humidity to get a status.' },
      ]

  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <h2>Let’s get your first zone set up</h2>
      <p className="mt-1 text-[15px] text-stone-600">The dashboard shows each zone’s status once it has a reading. Here is how to get there.</p>
      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-4">
            <span className="soft-icon">
              <AppIcon name={step.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-stone-900">
                {index + 1}. {step.title}
              </p>
              <p className="text-[15px] text-stone-600">{step.text}</p>
              {step.to && (
                <Link to={step.to} className="mt-1 inline-flex min-h-[44px] items-center font-semibold text-forest underline underline-offset-4">
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
