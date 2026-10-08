import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import { downloadFile, readError } from '../api/client.js'
import FormField from '../components/FormField.jsx'
import { EmptyState, ErrorAlert, InactiveBadge, Loading, PageHeader } from '../components/ui.jsx'
import useFetch from '../hooks/useFetch.js'
import { dateInputValue, endOfDayIso, formatDateTime, formatDateValue, formatNumber, startOfDayIso } from '../lib/format.js'
import { ENVIRONMENT_LABEL } from '../lib/status.js'
import { btnPrimary, btnSecondary } from '../lib/styles.js'

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

  const { data: report, error, loading } = useFetch(ready ? `/reports/water?${new URLSearchParams(params)}` : null)

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
    <div>
      <div className="print:hidden">
        <PageHeader title="Water report" subtitle="Water recommended by the system compared with water actually applied.">
          <button type="button" className={btnPrimary} disabled={!report} onClick={print}>
            Print / Save as PDF
          </button>
          <button
            type="button"
            className={btnSecondary}
            disabled={!ready}
            onClick={() => download('/reports/water.csv', 'sibol-water-report.csv')}
          >
            Report CSV
          </button>
          <button
            type="button"
            className={btnSecondary}
            disabled={!ready}
            onClick={() => download('/reports/readings.csv', 'sibol-readings.csv')}
          >
            All readings CSV
          </button>
        </PageHeader>

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <FormField
            label="From"
            id="report_from"
            type="date"
            required
            max={filters.to || undefined}
            value={filters.from}
            onChange={(event) => setFilter('from', event.target.value)}
          />
          <FormField
            label="To"
            id="report_to"
            type="date"
            required
            min={filters.from || undefined}
            max={dateInputValue()}
            value={filters.to}
            onChange={(event) => setFilter('to', event.target.value)}
          />
          <div className="col-span-2 sm:col-span-1">
            <FormField
              label="Farm"
              id="report_farm"
              as="select"
              value={filters.farm_id}
              onChange={(event) => setFilter('farm_id', event.target.value)}
            >
              <option value="">All farms</option>
              {farms.data?.farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </FormField>
          </div>
        </div>

        <ErrorAlert>{error || downloadError}</ErrorAlert>
      </div>

      {/* Heading for the printed page; the on-screen header and filters are hidden in print. */}
      <div className="mb-4 hidden print:block">
        <h1 className="text-2xl font-semibold text-stone-900">Sibol water report</h1>
        {ready && (
          <p className="text-stone-700">
            {formatDateValue(filters.from)} to {formatDateValue(filters.to)} · {farmName}
          </p>
        )}
        {printedAt && <p className="text-sm text-stone-500">Printed {formatDateTime(printedAt)}</p>}
      </div>

      {loading && <Loading />}

      {report && !error && (
        <>
          {report.farms.length === 0 ? (
            <EmptyState>No readings in this date range.</EmptyState>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Tile label="Recommended" value={`${formatNumber(report.totals.recommended_liters)} L`} />
                <Tile label="Applied" value={`${formatNumber(report.totals.applied_liters)} L`} />
                <Tile label="Difference" value={describeDifference(report.totals.difference_liters)} />
                <Tile
                  label="Water applied not recorded"
                  value={`${report.totals.not_recorded_count} of ${report.totals.readings_count}`}
                  note="readings"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white print:overflow-visible">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Zone</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Readings</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Not recorded</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Recommended</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Applied</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Difference</th>
                    </tr>
                  </thead>
                  {report.farms.map((farm) => (
                    <tbody key={farm.id} className="divide-y divide-stone-100 border-b border-stone-200">
                      <tr className="bg-stone-50">
                        <th colSpan={6} scope="colgroup" className="px-3 py-2 text-left font-semibold text-stone-900">
                          {farm.name}
                        </th>
                      </tr>
                      {farm.zones.map((zone) => (
                        <tr key={zone.id}>
                          <td className="px-3 py-2">
                            <Link to={`/zones/${zone.id}`} className="font-medium text-stone-900 hover:text-green-700">
                              {zone.name}
                            </Link>{' '}
                            {!zone.is_active && <InactiveBadge />}
                            <span className="block text-stone-500">
                              {zone.crop} · {ENVIRONMENT_LABEL[zone.environment]}
                            </span>
                          </td>
                          <Figures figures={zone} />
                        </tr>
                      ))}
                      <tr className="font-medium text-stone-900">
                        <td className="px-3 py-2">Total for {farm.name}</td>
                        <Figures figures={farm.totals} />
                      </tr>
                    </tbody>
                  ))}
                  {report.farms.length > 1 && (
                    <tfoot>
                      <tr className="bg-stone-50 font-semibold text-stone-900">
                        <td className="px-3 py-2">All farms</td>
                        <Figures figures={report.totals} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <p className="mt-3 text-sm text-stone-600">
                Recommended and applied liters are compared only for readings where the water applied was recorded.
                Readings without it are counted under "Not recorded" and left out of both totals. "Over" means more
                water was applied than recommended; "under" means less.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}

function Tile({ label, value, note }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-900">{value}</p>
      {note && <p className="text-sm text-stone-500">{note}</p>}
    </div>
  )
}

function Figures({ figures }) {
  return (
    <>
      <td className="whitespace-nowrap px-3 py-2 text-right">{figures.readings_count}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right">{figures.not_recorded_count}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right">{formatNumber(figures.recommended_liters)} L</td>
      <td className="whitespace-nowrap px-3 py-2 text-right">{formatNumber(figures.applied_liters)} L</td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        {figures.compared_count === 0 ? <span className="text-stone-400">nothing to compare</span> : describeDifference(figures.difference_liters)}
      </td>
    </>
  )
}
