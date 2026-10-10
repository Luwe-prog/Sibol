import { Fragment, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import { downloadFile, readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { AppIcon } from '../components/icons.jsx'
import { EmptyState, ErrorAlert, InactiveBadge, Loading, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { dateInputValue, endOfDayIso, formatDateTime, formatDateValue, formatNumber, startOfDayIso } from '../lib/format.js'
import { ENVIRONMENT_LABEL } from '../lib/status.js'

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const describeDifference = (liters) => {
  if (liters > 0) return `${formatNumber(liters)} L over`
  if (liters < 0) return `${formatNumber(-liters)} L under`
  return 'On target'
}

export default function WaterReportPage() {
  const [filters, setFilters] = useState({ from: dateInputValue(30), to: dateInputValue(), farm_id: '' })
  const [downloadError, setDownloadError] = useState('')
  // Shown on the printed page. Set when the Print button is pressed.
  const [printedAt, setPrintedAt] = useState(null)
  const farms = useFetch('/farms')

  const setFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }))

  // Both dates are needed; while one is being cleared and retyped, keep showing the last report.
  const ready = Boolean(filters.from && filters.to)
  const params = ready
    ? {
        from: startOfDayIso(filters.from),
        to: endOfDayIso(filters.to),
        ...(filters.farm_id ? { farm_id: filters.farm_id } : {}),
      }
    : null

  const { data: report, error, loading, reload } = useFetch(ready ? `/reports/water?${new URLSearchParams(params)}` : null)

  const download = async (path, fallbackName) => {
    setDownloadError('')
    try {
      await downloadFile(path, { ...params, timezone: TIMEZONE }, fallbackName)
    } catch (err) {
      setDownloadError(readError(err).message)
    }
  }

  const print = () => {
    // flushSync puts the timestamp on the page before the print dialog opens.
    flushSync(() => setPrintedAt(new Date()))
    window.print()
  }

  const farmName = filters.farm_id
    ? farms.data?.farms.find((farm) => String(farm.id) === String(filters.farm_id))?.name
    : 'All farms'

  return (
    <>
      <PageHeader title="Water report" subtitle="Water recommended by the system compared with water actually applied.">
        <button type="button" className="btn btn-primary" disabled={!report} onClick={print}>
          <AppIcon name="printer" />
          Print / Save as PDF
        </button>
        <button type="button" className="btn btn-secondary" disabled={!ready} onClick={() => download('/reports/water.csv', 'sibol-water-report.csv')}>
          <AppIcon name="download" />
          Report CSV
        </button>
        <button type="button" className="btn btn-secondary" disabled={!ready} onClick={() => download('/reports/readings.csv', 'sibol-readings.csv')}>
          <AppIcon name="download" />
          All readings CSV
        </button>
      </PageHeader>

      <section className="card filter-card">
        <FormField
          label="From date"
          id="report_from"
          type="date"
          required
          max={filters.to || undefined}
          value={filters.from}
          onChange={(event) => setFilter('from', event.target.value)}
        />
        <FormField
          label="To date"
          id="report_to"
          type="date"
          required
          min={filters.from || undefined}
          max={dateInputValue()}
          value={filters.to}
          onChange={(event) => setFilter('to', event.target.value)}
        />
        <FormField label="Farm" id="report_farm" as="select" value={filters.farm_id} onChange={(event) => setFilter('farm_id', event.target.value)}>
          <option value="">All farms</option>
          {farms.data?.farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name}
            </option>
          ))}
        </FormField>
      </section>

      <div className="print:hidden">
        <ErrorAlert onRetry={error ? reload : undefined}>{error || downloadError}</ErrorAlert>
      </div>

      {/* Details for the printed page; the buttons and filters are hidden in print. */}
      <div className="mb-4 hidden print:block">
        {ready && (
          <p>
            {formatDateValue(filters.from)} to {formatDateValue(filters.to)} · {farmName}
          </p>
        )}
        {printedAt && <p className="muted">Printed {formatDateTime(printedAt)}</p>}
      </div>

      {loading && <Loading />}

      {report && !error && report.farms.length === 0 && (
        <EmptyState icon="report" title="No readings in this date range">
          Try a wider range, or another farm.
        </EmptyState>
      )}

      {report && !error && report.farms.length > 0 && (
        <>
          <div className="stat-grid report-stats">
            <Stat label="Recommended" value={`${formatNumber(report.totals.recommended_liters)} L`} />
            <Stat label="Applied" value={`${formatNumber(report.totals.applied_liters)} L`} />
            <Stat label="Difference" value={describeDifference(report.totals.difference_liters)} />
            <Stat
              label="Water applied not recorded"
              value={`${report.totals.not_recorded_count} of ${report.totals.readings_count}`}
              hint="readings"
            />
          </div>

          <section className="card table-card">
            <div className="section-heading">
              <h2>Water use by farm</h2>
              <AppIcon name="droplet" />
            </div>
            <table className="data-table report-table">
              <thead>
                <tr>
                  <th scope="col">Zone</th>
                  <th scope="col">Readings</th>
                  <th scope="col">Not recorded</th>
                  <th scope="col">Recommended</th>
                  <th scope="col">Applied</th>
                  <th scope="col">Difference</th>
                </tr>
              </thead>
              <tbody>
                {report.farms.map((farm) => (
                  <Fragment key={farm.id}>
                    <tr className="farm-table-heading">
                      <td colSpan={6}>
                        <AppIcon name="leaf" />
                        {farm.name}
                      </td>
                    </tr>
                    {farm.zones.map((zone) => (
                      <tr key={zone.id}>
                        <td>
                          <strong>
                            <Link to={`/zones/${zone.id}`}>{zone.name}</Link>
                          </strong>{' '}
                          {!zone.is_active && <InactiveBadge />}
                          <span className="table-subtext">
                            {zone.crop} · {ENVIRONMENT_LABEL[zone.environment]}
                          </span>
                        </td>
                        <Figures figures={zone} />
                      </tr>
                    ))}
                    <tr className="farm-total">
                      <td>{farm.name} total</td>
                      <Figures figures={farm.totals} />
                    </tr>
                  </Fragment>
                ))}
                {report.farms.length > 1 && (
                  <tr className="grand-total">
                    <td>All farms</td>
                    <Figures figures={report.totals} />
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <p className="report-note">
            <AppIcon name="info" />
            <span>
              Only readings with water applied recorded are compared. Readings without it are counted under “Not recorded”
              and left out of both totals. “Over” means more water was applied than recommended; “under” means less.
            </span>
          </p>
        </>
      )}
    </>
  )
}

function Stat({ label, value, hint }) {
  return (
    <section className="card report-stat">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      {hint && <span className="muted">{hint}</span>}
    </section>
  )
}

// data-label is what a phone shows beside each number, where the table becomes stacked cards.
function Figures({ figures }) {
  return (
    <>
      <td data-label="Readings">{figures.readings_count}</td>
      <td data-label="Not recorded">{figures.not_recorded_count}</td>
      <td data-label="Recommended">{formatNumber(figures.recommended_liters)} L</td>
      <td data-label="Applied">{formatNumber(figures.applied_liters)} L</td>
      <td data-label="Difference">
        {figures.compared_count === 0 ? <span className="muted">Nothing to compare</span> : describeDifference(figures.difference_liters)}
      </td>
    </>
  )
}
