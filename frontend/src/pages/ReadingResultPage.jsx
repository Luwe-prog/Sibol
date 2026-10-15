import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { readError } from '../api/client.js'
import { AppIcon } from '../components/icons.jsx'
import { ConfirmDialog, ErrorAlert, Loading, PageHeader, StatusBadge } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { describeEstimate } from '../lib/estimate.js'
import { formatDateTime, formatNumber } from '../lib/format.js'
import { ENVIRONMENT_LABEL, FLAG, HUMIDITY_STATUS, MOISTURE_STATUS, TEMP_STATUS } from '../lib/status.js'
import { btnDanger, btnPrimary, btnPrimarySmall, btnSecondary, btnSmall, cardClass } from '../lib/styles.js'

// The instant result shown right after a reading is saved; also the detail view of any past reading.
export default function ReadingResultPage() {
  const { readingId } = useParams()
  const { data, error, loading, reload } = useFetch(`/readings/${readingId}`)

  if (loading) return <Loading />
  if (error) return <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

  return <ReadingResult key={data.reading.id} reading={data.reading} onChanged={reload} />
}

function ReadingResult({ reading, onChanged }) {
  const navigate = useNavigate()
  const zone = reading.zone
  const status = MOISTURE_STATUS[reading.moisture_status]
  const isDry = reading.moisture_status === 'too_dry'
  const canEnter = zone.is_active && zone.farm.is_active
  const estimate = describeEstimate(zone.watering_estimate)

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const deleteReading = async () => {
    setDeleting(true)
    try {
      await api.delete(`/readings/${reading.id}`)
      navigate(`/zones/${zone.id}`, { replace: true })
    } catch (err) {
      setError(readError(err).message)
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Reading result"
        subtitle={`${zone.farm.name} · ${zone.name} · ${zone.crop.name} · ${ENVIRONMENT_LABEL[zone.environment]}`}
        back={{ to: `/zones/${zone.id}`, label: `Back to ${zone.name}` }}
      />

      <ErrorAlert>{error}</ErrorAlert>

      {/* The loudest thing in the app: the status, and the liters when the zone is dry. */}
      <section role="status" className={`relative overflow-hidden rounded-xl border-2 p-5 lg:px-7 lg:py-6 ${status.tile}`}>
        <p className={`flex items-center gap-2.5 text-3xl font-bold ${status.text}`}>
          <AppIcon name={status.icon} className="h-8 w-8" />
          {status.label}
        </p>

        {isDry ? (
          <div className="mt-3">
            <p className="text-base font-semibold text-amber-900">Apply about</p>
            <p className="text-amber-900">
              <span className="text-7xl font-extrabold tracking-tight tabular-nums lg:text-[84px] lg:leading-none">
                {formatNumber(reading.recommended_liters)}
              </span>
              <span className="ml-1.5 text-4xl font-bold">L</span>
            </p>
          </div>
        ) : null}

        {/* When the zone is not dry, the advice itself is the headline ("No watering needed." / "Hold off watering…"). */}
        <p className={isDry ? `mt-3 text-base leading-relaxed lg:text-[17px] ${status.num}` : `mt-3 text-xl font-semibold leading-snug ${status.num}`}>
          {reading.recommendation_text}
        </p>
      </section>

      {!isDry && estimate?.short && (
        <p className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-stone-700">
          <AppIcon name="calendar" className="text-green-800" />
          <span>
            <span className="font-semibold text-green-900">{estimate.short}.</span> An estimate for this zone from its recent readings.
          </span>
        </p>
      )}

      {reading.is_suspicious && (
        <p className="flex items-start gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-[15px] text-orange-900">
          <AppIcon name="warning" className="mt-0.5 h-5 w-5 text-orange-800" />
          <span>
            <span className="font-semibold">Marked as unusual.</span> {reading.suspicious_reason}
          </span>
        </p>
      )}

      <WaterApplied reading={reading} isDry={isDry} onChanged={onChanged} />

      <section className={cardClass}>
        <h2 className="border-b border-line px-4 py-3.5 text-lg font-semibold text-charcoal sm:px-5">What you entered</h2>
        <dl className="divide-y divide-line px-4 sm:px-5">
          <ValueRow icon="droplet" label="Soil moisture" value={`${formatNumber(reading.soil_moisture)}%`} status={status} />
          <ValueRow icon="thermometer" label="Temperature" value={`${formatNumber(reading.temperature)} °C`} status={TEMP_STATUS[reading.temp_status]} />
          <ValueRow icon="wind" label="Humidity" value={`${formatNumber(reading.humidity)}%`} status={HUMIDITY_STATUS[reading.humidity_status]} />
          <div className="flex min-h-[60px] items-center justify-between gap-3 py-2">
            <dt className="flex items-center gap-2 text-[15px] text-stone-700">
              <AppIcon name="clock" className="text-green-800" />
              Recorded
            </dt>
            <dd className="text-right text-[15px] font-semibold text-stone-900">
              {formatDateTime(reading.recorded_at)}
              {reading.entered_by_user && <span className="block font-normal text-stone-600">by {reading.entered_by_user.name}</span>}
              {reading.source === 'csv' && (
                <span className="mt-1 inline-block">
                  <StatusBadge status={FLAG.imported} />
                </span>
              )}
            </dd>
          </div>
          {reading.notes && (
            <div className="py-3">
              <dt className="text-[15px] text-stone-700">Notes</dt>
              <dd className="mt-1 whitespace-pre-line text-[15px] text-stone-900">{reading.notes}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* A clear way to finish, so nobody has to hunt for the small link at the top. */}
      <section className={`${cardClass} p-4 sm:p-5`}>
        <h2>What next?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/" className={`w-full sm:w-auto ${btnPrimary}`}>
            <AppIcon name="check" />
            Done, back to dashboard
          </Link>
          {canEnter && (
            <Link to={`/zones/${zone.id}/readings/new`} className={`flex-1 sm:flex-none ${btnSecondary}`}>
              <AppIcon name="plus" />
              Enter another reading
            </Link>
          )}
          <Link to={`/zones/${zone.id}`} className={`flex-1 sm:flex-none ${btnSecondary}`}>
            <AppIcon name="history" />
            See this zone’s history
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <p className="mr-auto w-full text-sm text-stone-600 sm:w-auto">Made a mistake in this reading?</p>
          <Link to={`/readings/${reading.id}/edit`} className={`flex-1 sm:flex-none ${btnSecondary}`}>
            <AppIcon name="pencil" />
            Edit
          </Link>
          <button type="button" className={`flex-1 sm:flex-none ${btnDanger}`} onClick={() => setConfirmingDelete(true)}>
            <AppIcon name="trash" />
            Delete
          </button>
        </div>
      </section>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this reading?"
          confirmLabel={deleting ? 'Deleting…' : 'Delete reading'}
          danger
          busy={deleting}
          onConfirm={deleteReading}
          onCancel={() => setConfirmingDelete(false)}
        >
          {zone.name} · {formatDateTime(reading.recorded_at)}. It will be removed from the zone’s history and the water report.
        </ConfirmDialog>
      )}
    </div>
  )
}

function ValueRow({ icon, label, value, status }) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-3 py-2">
      <dt className="flex items-center gap-2 text-[15px] text-stone-700">
        <AppIcon name={icon} className="text-green-800" />
        {label}
      </dt>
      <dd className="flex items-center gap-2.5">
        <span className="text-xl font-bold tabular-nums text-stone-900">{value}</span>
        <StatusBadge status={status} />
      </dd>
    </div>
  )
}

const describeDifference = (liters) => {
  if (liters > 0) return `${formatNumber(liters)} L over`
  if (liters < 0) return `${formatNumber(-liters)} L under`
  return 'On target'
}

// Where the Admin records what they really poured, with the recommendation always beside it.
function WaterApplied({ reading, isDry, onChanged }) {
  const recorded = reading.water_applied_liters !== null
  const [editing, setEditing] = useState(!recorded)
  const [amount, setAmount] = useState(reading.water_applied_liters ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const recommended = formatNumber(reading.recommended_liters)

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.put(`/readings/${reading.id}`, { water_applied_liters: amount === '' ? null : amount })
      setEditing(amount === '')
      onChanged()
    } catch (err) {
      const { message, fields } = readError(err)
      setError(fields.water_applied_liters ?? message)
    } finally {
      setSaving(false)
    }
  }

  if (recorded && !editing) {
    return (
      <section className={`${cardClass} space-y-3.5 p-4 lg:p-6`}>
        <div role="status">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-green-800">
            <AppIcon name="optimal" />
            Saved. The water you used is recorded.
          </p>
          {/* Saving changes nothing on this page, so say where the number goes. */}
          <p className="mt-1 text-sm text-stone-600">
            It is counted in the{' '}
            <Link to="/reports/water" className="font-semibold text-forest underline underline-offset-2 hover:text-forest-dark">
              Water report
            </Link>
            , where recommended and applied water are compared.
          </p>
          {/* This reading stays as it was measured, so point to the reading that shows the effect. */}
          {reading.water_applied_liters > 0 && (
            <p className="mt-1 text-sm text-stone-600">
              This result stays as it was measured. To check if the watering worked, take a new reading in a few hours, once the
              water has soaked in.
            </p>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2.5">
          <SummaryBox label="Recommended" value={`${recommended} L`} />
          <SummaryBox label="Applied" value={`${formatNumber(reading.water_applied_liters)} L`} />
          <SummaryBox label="Difference" value={describeDifference(reading.water_applied_liters - reading.recommended_liters)} />
        </dl>
        <button type="button" className={btnSmall} onClick={() => setEditing(true)}>
          <AppIcon name="pencil" className="h-4 w-4" />
          Change amount
        </button>
      </section>
    )
  }

  return (
    <form onSubmit={save} className={`${cardClass} space-y-3.5 p-4 lg:p-6`}>
      <div>
        <h2 className="text-lg font-semibold text-charcoal">How much water did you actually use?</h2>
        <p className="mt-1 text-[15px] text-stone-600">
          After you water, type the liters you really poured. Sibol compares it with what it recommended, in the Water report.
          {!isDry && ' If you did not water, type 0.'}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_1.2fr] items-end gap-2.5">
        <div className="rounded-lg border border-line bg-cream px-3 py-2.5">
          <p className="text-xs text-stone-600">Sibol recommended</p>
          <p className="text-2xl font-bold tabular-nums text-stone-900">{recommended} L</p>
        </div>
        <div>
          <label htmlFor="water_applied" className="mb-1.5 block text-sm font-semibold text-stone-800">
            You applied
          </label>
          <div className="relative">
            <input
              id="water_applied"
              type="number"
              inputMode="decimal"
              autoComplete="off"
              step="0.01"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-invalid={error ? true : undefined}
              className={`h-14 w-full rounded-lg border bg-white pl-4 pr-10 text-2xl font-semibold tabular-nums text-stone-900 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700 ${error ? 'border-red-700' : 'border-field'}`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg font-semibold text-stone-600">L</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-sm font-medium text-red-700">
          <AppIcon name="alert-circle" className="mt-0.5 h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btnPrimarySmall} disabled={saving || (amount === '' && !recorded)}>
          {saving ? 'Saving…' : 'Save water applied'}
        </button>
        {isDry ? (
          <button type="button" className={btnSmall} onClick={() => setAmount(String(reading.recommended_liters))}>
            I poured the full {recommended} L
          </button>
        ) : (
          <button type="button" className={btnSmall} onClick={() => setAmount('0')}>
            I did not water (0 L)
          </button>
        )}
        {recorded && (
          <button type="button" className={btnSmall} onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}
      </div>
      <p className="text-sm text-stone-600">Not watered yet? Leave this for now and come back to this reading later.</p>
    </form>
  )
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-cream px-3 py-2.5">
      <dt className="text-xs text-stone-600">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold tabular-nums text-stone-900">{value}</dd>
    </div>
  )
}
