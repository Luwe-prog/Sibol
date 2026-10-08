import { useState } from 'react'
import api, { readError } from '../api/client.js'
import { btnPrimary, btnSecondary, linkClass } from '../lib/styles.js'
import { ErrorAlert, Modal } from './ui.jsx'

const TEMPLATE = [
  'recorded_at,soil_moisture,temperature,humidity,water_applied_liters,notes',
  '2026-10-06 07:30,58,29,68,6,Watered after reading',
  '2026-10-07 07:30,71,30,66,0,',
].join('\n')

const downloadTemplate = () => {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' }))
  link.download = 'sibol-readings-template.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

export default function ImportReadingsModal({ zone, onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [rowErrors, setRowErrors] = useState([])
  const [rowErrorCount, setRowErrorCount] = useState(0)
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setUploading(true)
    setError('')
    setRowErrors([])

    const body = new FormData()
    body.append('file', file)
    body.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)

    try {
      const response = await api.post(`/zones/${zone.id}/readings/import`, body)
      setResult(response.data)
      onImported()
    } catch (err) {
      const { message, fields } = readError(err)
      setError(fields.file ?? message)
      setRowErrors(err.response?.data?.row_errors ?? [])
      setRowErrorCount(err.response?.data?.row_error_count ?? 0)
    } finally {
      setUploading(false)
    }
  }

  if (result) {
    return (
      <Modal title="Import finished" onClose={onClose}>
        <p className="text-stone-800">
          {result.imported} {result.imported === 1 ? 'reading was' : 'readings were'} added to {zone.name}.
        </p>
        {result.flagged > 0 && (
          <p className="mt-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-900">
            {result.flagged} of them {result.flagged === 1 ? 'has' : 'have'} unusual values and {result.flagged === 1 ? 'is' : 'are'}{' '}
            marked "Unusual" in the history. Check {result.flagged === 1 ? 'it' : 'them'}.
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <button type="button" className={btnPrimary} onClick={onClose}>
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`Import readings into ${zone.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-stone-600">
          <p>Upload a CSV file with one reading per line. The first line must name the columns:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <code className="text-stone-900">recorded_at</code>: date and time, such as 2026-10-06 07:30
            </li>
            <li>
              <code className="text-stone-900">soil_moisture</code>, <code className="text-stone-900">temperature</code>,{' '}
              <code className="text-stone-900">humidity</code>
            </li>
            <li>
              <code className="text-stone-900">water_applied_liters</code> and <code className="text-stone-900">notes</code> are
              optional
            </li>
          </ul>
          <p className="mt-2">
            Up to 500 readings per file. If any line has a problem, nothing is imported and each problem is listed.{' '}
            <button type="button" className={linkClass} onClick={downloadTemplate}>
              Download a template
            </button>
          </p>
        </div>

        <div>
          <label htmlFor="import_file" className="mb-1 block text-sm font-medium text-stone-700">
            CSV file
          </label>
          <input
            id="import_file"
            type="file"
            accept=".csv,text/csv"
            required
            onChange={(event) => setFile(event.target.files[0] ?? null)}
            className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border file:border-stone-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-stone-700"
          />
        </div>

        <ErrorAlert>{error}</ErrorAlert>

        {rowErrors.length > 0 && (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-red-200 text-sm">
            <table className="w-full text-left">
              <thead className="bg-red-50 text-red-900">
                <tr>
                  <th className="px-3 py-2 font-medium">Line</th>
                  <th className="px-3 py-2 font-medium">Problem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {rowErrors.map((row) => (
                  <tr key={row.line}>
                    <td className="px-3 py-2 align-top text-stone-900">{row.line}</td>
                    <td className="px-3 py-2 text-stone-700">{row.errors.join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rowErrorCount > rowErrors.length && (
              <p className="px-3 py-2 text-stone-600">…and {rowErrorCount - rowErrors.length} more lines.</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary} disabled={!file || uploading}>
            {uploading ? 'Importing…' : 'Import'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
