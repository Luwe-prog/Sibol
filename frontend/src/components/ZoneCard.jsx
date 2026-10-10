import { Link } from 'react-router-dom'
import { describeEstimate } from '../lib/estimate.js'
import { daysSince, formatDateTime, formatNumber, formatRelative } from '../lib/format.js'
import { ENVIRONMENT_LABEL, FLAG, HUMIDITY_STATUS, MOISTURE_STATUS, NO_READINGS, TEMP_STATUS } from '../lib/status.js'
import { AppIcon } from './icons.jsx'
import { Badge, StatusBadge } from './ui.jsx'

const CARD_TONE = { too_dry: 'zone-dry', optimal: 'zone-optimal', too_wet: 'zone-wet' }

// One sentence about the soil, shown when there is no warning badge to show instead.
const SOIL_NOTE = {
  optimal: 'Within the ideal soil moisture range',
  too_dry: 'Below the ideal soil moisture range',
  too_wet: 'Above the ideal soil moisture range',
}

function Measure({ label, icon, value, unit }) {
  return (
    <div>
      <span className="measurement-label">
        <AppIcon name={icon} />
        {label}
      </span>
      <strong>
        {value}
        {value !== '–' && <span>{unit}</span>}
      </strong>
    </div>
  )
}

// One zone as a card, headed by its status.
// `canEnter` hides "Enter reading" for an inactive farm. `children` are extra buttons.
export default function ZoneCard({ zone, canEnter = true, showWaterFactor = false, showAdvice = false, children }) {
  const latest = zone.latest_reading
  const inactive = zone.is_active === false
  const status = latest ? MOISTURE_STATUS[latest.moisture_status] : NO_READINGS
  const tone = inactive || !latest ? 'zone-none' : CARD_TONE[latest.moisture_status]
  const estimate = describeEstimate(zone.watering_estimate)

  const warnings = latest && (zone.is_stale || latest.temp_status !== 'optimal' || latest.humidity_status !== 'optimal')
  const value = (number) => (latest ? formatNumber(number) : '–')

  return (
    <article className={`card zone-card ${tone}`}>
      <div className="zone-status">
        <span className="attention-badges">
          <StatusBadge status={status} />
          {inactive && <StatusBadge status={FLAG.inactive} />}
        </span>
        {latest && (
          <span className="reading-age" title={formatDateTime(latest.recorded_at)}>
            <AppIcon name="clock" />
            Updated {formatRelative(latest.recorded_at)}
          </span>
        )}
      </div>

      <div className="zone-identity">
        <div>
          <h3>
            <Link to={`/zones/${zone.id}`}>{zone.name}</Link>
          </h3>
          <p>
            <AppIcon name="sprout" />
            {zone.crop.name}
            <span className="dot-separator">·</span>
            {ENVIRONMENT_LABEL[zone.environment]}
            {showWaterFactor && (
              <>
                <span className="dot-separator">·</span>
                {formatNumber(zone.water_factor)} L per point
              </>
            )}
          </p>
        </div>
        <span className="zone-leaf" aria-hidden="true">
          <AppIcon name="leaf" />
        </span>
      </div>

      <div className="measurement-grid">
        <Measure label="Soil moisture" icon="droplet" value={value(latest?.soil_moisture)} unit="%" />
        <Measure label="Temperature" icon="thermometer" value={value(latest?.temperature)} unit="°C" />
        <Measure label="Humidity" icon="wind" value={value(latest?.humidity)} unit="%" />
      </div>

      <div className="zone-footnote">
        {!latest ? (
          <p>
            <AppIcon name="info" />
            {inactive ? 'This zone was never read.' : 'Take the first reading to get a status.'}
          </p>
        ) : warnings ? (
          <div className="warning-badges">
            {zone.is_stale && (
              <Badge className={FLAG.stale.badge} icon={FLAG.stale.icon}>
                {FLAG.stale.label(daysSince(latest.recorded_at))}
              </Badge>
            )}
            {latest.temp_status !== 'optimal' && <StatusBadge status={TEMP_STATUS[latest.temp_status]} />}
            {latest.humidity_status !== 'optimal' && (
              <StatusBadge status={HUMIDITY_STATUS[latest.humidity_status]} label={HUMIDITY_STATUS[latest.humidity_status].flag} />
            )}
          </div>
        ) : (
          <p>
            <AppIcon name={status.icon} />
            {SOIL_NOTE[latest.moisture_status]}
          </p>
        )}

        {/* A Too Dry card already says "water now", so the estimate would only repeat it. */}
        {latest && !inactive && latest.moisture_status !== 'too_dry' && estimate?.short && (
          <p className="zone-next">
            <AppIcon name="calendar" />
            {estimate.short}
          </p>
        )}
      </div>

      <div className="zone-actions">
        {canEnter && !inactive && (
          <Link to={`/zones/${zone.id}/readings/new`} className="btn btn-primary">
            <AppIcon name="plus" />
            Enter reading
          </Link>
        )}
        {showAdvice && latest && (
          <Link to={`/readings/${latest.id}`} className="btn btn-secondary">
            Advice
            <AppIcon name="arrow-right" />
          </Link>
        )}
        {children}
      </div>
    </article>
  )
}
