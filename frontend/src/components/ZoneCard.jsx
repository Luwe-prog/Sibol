import { Link } from 'react-router-dom'
import { describeEstimate } from '../lib/estimate.js'
import { daysSince, formatDateTime, formatNumber, formatRelative } from '../lib/format.js'
import { ENVIRONMENT_ICON, ENVIRONMENT_LABEL, FLAG, HUMIDITY_STATUS, MOISTURE_STATUS, NO_READINGS, TEMP_STATUS } from '../lib/status.js'
import { btnPrimarySmall, btnSmall, cardShadow } from '../lib/styles.js'
import { AppIcon } from './icons.jsx'
import { Badge, InactiveBadge, StatusBadge } from './ui.jsx'

// One zone as a card, headed by its status.
// `canEnter` hides "Enter reading" for an inactive zone or farm. `children` are extra buttons.
export default function ZoneCard({ zone, canEnter = true, showWaterFactor = false, showAdvice = false, children }) {
  const latest = zone.latest_reading
  const inactive = zone.is_active === false
  const status = inactive ? FLAG.inactive : latest ? MOISTURE_STATUS[latest.moisture_status] : NO_READINGS
  // The inactive palette has only badge colors, so its card borrows the gray "no readings" look.
  const look = inactive ? NO_READINGS : status
  const estimate = describeEstimate(zone.watering_estimate)

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-white ${cardShadow} ${look.card}`}>
      <div className={`flex items-center gap-2.5 border-b px-4 py-3 ${look.head}`}>
        <AppIcon name={status.icon} className="h-6 w-6" />
        <p className={latest && !inactive ? 'text-xl font-bold' : 'text-[17px] font-bold'}>{status.label}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-green-950">
            <Link to={`/zones/${zone.id}`} className="hover:underline">
              {zone.name}
            </Link>
            {inactive && latest && <InactiveBadge />}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-stone-600">
            {zone.crop.name} ·
            <AppIcon name={ENVIRONMENT_ICON[zone.environment]} className="h-4 w-4" />
            {ENVIRONMENT_LABEL[zone.environment]}
            {showWaterFactor && ` · ${formatNumber(zone.water_factor)} L per point`}
          </p>
        </div>

        {latest ? (
          <>
            <dl className="grid grid-cols-3 gap-2 rounded-xl bg-stone-50 px-3 py-2.5">
              <div>
                <dt className="text-xs text-stone-600">Soil</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-stone-900">{formatNumber(latest.soil_moisture)}%</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-600">Temp.</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-stone-900">{formatNumber(latest.temperature)} °C</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-600">Humidity</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-stone-900">{formatNumber(latest.humidity)}%</dd>
              </div>
            </dl>

            {(latest.temp_status !== 'optimal' || latest.humidity_status !== 'optimal' || zone.is_stale) && (
              <div className="flex flex-wrap gap-1.5">
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
            )}

            <p className="flex items-center gap-1.5 text-sm text-stone-600" title={formatDateTime(latest.recorded_at)}>
              <AppIcon name="clock" className="h-4 w-4" />
              Updated {formatRelative(latest.recorded_at)}
            </p>

            {/* A Too Dry card already says "water now", so the estimate would only repeat it. */}
            {!inactive && latest.moisture_status !== 'too_dry' && estimate?.short && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-green-800">
                <AppIcon name="calendar" className="h-4 w-4" />
                {estimate.short}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-stone-600">{inactive ? 'This zone was never read.' : 'Take the first reading to get a status.'}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          {canEnter && !inactive && (
            <Link to={`/zones/${zone.id}/readings/new`} className={`flex-1 ${btnPrimarySmall}`}>
              <AppIcon name="plus" className="h-4 w-4" />
              Enter reading
            </Link>
          )}
          {showAdvice && latest && (
            <Link to={`/readings/${latest.id}`} className={btnSmall}>
              <AppIcon name="bulb" className="h-4 w-4" />
              Advice
            </Link>
          )}
          {children}
        </div>
      </div>
    </article>
  )
}
