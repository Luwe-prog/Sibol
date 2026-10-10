import { useState } from "react"
import {
  Badge,
  Button,
  Card,
  Field,
  Header,
  Icon,
  StateView,
  type ViewState,
} from "./components"

export type Zone = {
  name: string
  farm: string
  crop: string
  type: string
  status: string
  soil: number
  temp: number
  humidity: number
  updated: string
  warnings?: string[]
}
export const zones: Zone[] = [
  {
    name: "garden bed",
    farm: "Gabs farm",
    crop: "Siling labuyo",
    type: "Rooftop",
    status: "Optimal",
    soil: 50,
    temp: 26,
    humidity: 70,
    updated: "2 hours ago",
  },
  {
    name: "Purok 5, Mabini Street",
    farm: "Louie Farm",
    crop: "Lettuce",
    type: "Rooftop",
    status: "Too Dry",
    soil: 50,
    temp: 26,
    humidity: 49,
    updated: "2 days ago",
    warnings: ["Too Hot", "Humidity too low"],
  },
]
export type Farm = {
  name: string
  location: string
  zones: number
  admins: string
}
export const farms: Farm[] = [
  {
    name: "Gabs farm",
    location: "Balantacan",
    zones: 1,
    admins: "Louie Jay Due",
  },
  {
    name: "Louie Farm",
    location: "Lubao Pampanga",
    zones: 1,
    admins: "Louie Jay Due",
  },
]
type ZoneActions = { onEnter?: (z: Zone) => void onAdvice?: (z: Zone) => void }
export function Dashboard({
  data = zones,
  state = "ready",
  compact = false,
  onEnter,
  onAdvice,
  onRefresh,
  onRetry,
}: ZoneActions & {
  data?: Zone[]
  state?: ViewState
  compact?: boolean
  onRefresh?: () => void
  onRetry?: () => void
}) {
  const attention = data.filter(
    (z) => z.status === "Too Dry" || z.status === "Too Wet",
  )
  return (
    <>
      {!compact && (
        <Header title="Dashboard" subtitle="Every active zone on every farm.">
          <Button variant="secondary" onClick={onRefresh}>
            <Icon name="refresh" />
            Refresh
          </Button>
        </Header>
      )}
      {state !== "ready" ? (
        <StateView state={state} noun="zones" onRetry={onRetry} />
      ) : (
        <>
          {!compact && (
            <div className="stat-grid">
              {["Too Dry", "Optimal", "Too Wet", "No readings yet"].map(
                (status, i) => (
                  <Card className={`stat-card stat-${i}`} key={status}>
                    <div className="stat-top">
                      <span>{status}</span>
                      <span className={`stat-icon tone-${i}`}>
                        <Icon
                          name={i === 1 ? "check" : i === 3 ? "clock" : "drop"}
                        />
                      </span>
                    </div>
                    <div className="stat-bottom">
                      <strong>
                        {data.filter((z) => z.status === status).length}
                      </strong>
                      <span>
                        {status === "Too Dry"
                          ? "Ready for a little water"
                          : status === "Optimal"
                            ? "Right where they should be"
                            : status === "Too Wet"
                              ? "Let the soil rest"
                              : "Waiting for a first reading"}
                      </span>
                    </div>
                  </Card>
                ),
              )}
            </div>
          )}
          <Card className="attention-card">
            <div className="section-heading">
              <div className="section-title">
                <span className="attention-icon">
                  <Icon name="warning" />
                </span>
                <h2>Needs attention</h2>
                <span className="small-count">{attention.length}</span>
              </div>
              <span className="section-helper">
                A little care goes a long way.
              </span>
            </div>
            {attention.length === 0 ? (
              <p className="attention-empty">
                <Icon name="check" />
                Nothing needs attention.
              </p>
            ) : (
              attention.map((z) => (
                <div className="attention-row" key={z.name}>
                  <div className="attention-zone">
                    <Badge status={z.status} />
                    <strong>{z.name}</strong>
                    <span className="muted">
                      {z.farm} <span className="dot-separator">·</span> {z.crop}
                    </span>
                  </div>
                  <div className="attention-measurement">
                    <strong>
                      {z.soil}
                      <span>%</span>
                    </strong>
                    <span className="muted">Soil moisture</span>
                    <span className="reading-age">
                      <Icon name="clock" />
                      {z.updated}
                    </span>
                  </div>
                  <div className="water-instruction">
                    <span className="water-icon">
                      <Icon name="drop" />
                    </span>
                    <div>
                      <strong>
                        {z.status === "Too Dry"
                          ? "Water now"
                          : "Hold off on watering"}
                      </strong>
                      <span>
                        {z.status === "Too Dry"
                          ? "Apply about 20 L"
                          : "Let the soil dry"}
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => onEnter?.(z)}>
                    <Icon name="plus" />
                    Enter reading
                  </Button>
                </div>
              ))
            )}
          </Card>
          <div className="zones-heading">
            <h2>Your growing zones</h2>
            <span className="muted">
              {data.length} zones across {new Set(data.map((z) => z.farm)).size}{" "}
              farms
            </span>
          </div>
          <div className="farm-zone-grid">
            {Array.from(new Set(data.map((z) => z.farm))).map((farm) => (
              <section key={farm} className="farm-zone-group">
                <div className="farm-group-heading">
                  <span className="farm-heading-icon">
                    <Icon name="leaf" />
                  </span>
                  <h3>{farm}</h3>
                  <span>{data.filter((z) => z.farm === farm).length} zone</span>
                </div>
                {data
                  .filter((z) => z.farm === farm)
                  .map((z) => (
                    <Card
                      className={`zone-card zone-${
                        z.status === "Optimal" ? "optimal" : "dry"
                      }`}
                      key={z.name}
                    >
                      <div className="zone-status">
                        <Badge status={z.status} />
                        <span className="reading-age">
                          <Icon name="clock" />
                          Updated {z.updated}
                        </span>
                      </div>
                      <div className="zone-identity">
                        <div>
                          <h3>{z.name}</h3>
                          <p>
                            <Icon name="sprout" />
                            {z.crop}
                            <span className="dot-separator">·</span>
                            {z.type}
                          </p>
                        </div>
                        <span className="zone-leaf">
                          <Icon name="leaf" />
                        </span>
                      </div>
                      <div className="measurement-grid">
                        {[
                          {
                            label: "Soil moisture",
                            value: z.soil,
                            unit: "%",
                            icon: "drop",
                          },
                          {
                            label: "Temperature",
                            value: z.temp,
                            unit: "°C",
                            icon: "temp",
                          },
                          {
                            label: "Humidity",
                            value: z.humidity,
                            unit: "%",
                            icon: "sun",
                          },
                        ].map((m) => (
                          <div key={m.label}>
                            <span className="measurement-label">
                              <Icon name={m.icon} />
                              {m.label}
                            </span>
                            <strong>
                              {m.value}
                              <span>{m.unit}</span>
                            </strong>
                          </div>
                        ))}
                      </div>
                      <div className="zone-footnote">
                        {z.warnings?.length ? (
                          <div className="warning-badges">
                            {z.warnings.map((w) => (
                              <Badge key={w} status={w} />
                            ))}
                          </div>
                        ) : (
                          <p>
                            <Icon name="check" />
                            Within the ideal soil moisture range
                          </p>
                        )}
                      </div>
                      <div className="zone-actions">
                        <Button onClick={() => onEnter?.(z)}>
                          <Icon name="plus" />
                          Enter reading
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => onAdvice?.(z)}
                        >
                          Advice
                          <Icon name="arrow" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </section>
            ))}
          </div>
        </>
      )}
    </>
  )
}
export function Farms({
  data = farms,
  state = "ready",
  onCreate,
  onEdit,
  onOpen,
  onRetry,
}: {
  data?: Farm[]
  state?: ViewState
  onCreate?: () => void
  onEdit?: (f: Farm) => void
  onOpen?: (f: Farm) => void
  onRetry?: () => void
}) {
  return (
    <>
      <Header title="Farms" subtitle="All farms in the system.">
        <Button onClick={onCreate}>
          <Icon name="plus" />
          New farm
        </Button>
      </Header>
      {state !== "ready" ? (
        <StateView state={state} noun="farms" onRetry={onRetry} />
      ) : (
        <div className="farm-grid">
          {data.map((f) => (
            <Card className="farm-card" key={f.name}>
              <div className="farm-card-banner">
                <Icon name="sprout" />
                <span>
                  {f.zones} {f.zones === 1 ? "zone" : "zones"}
                </span>
                <div className="farm-art" aria-hidden="true">
                  <Icon name="leaf" />
                  <Icon name="sprout" />
                  <Icon name="leaf" />
                </div>
              </div>
              <div className="farm-card-body">
                <h2>{f.name}</h2>
                <p className="muted icon-line">
                  <Icon name="pin" />
                  {f.location}
                </p>
                <div className="farm-admin">
                  <span className="field-label">Assigned Admins</span>
                  <span className="icon-line">
                    <Icon name="users" />
                    {f.admins}
                  </span>
                </div>
                <div className="zone-actions">
                  <Button onClick={() => onOpen?.(f)}>
                    Open farm
                    <Icon name="arrow" />
                  </Button>
                  <Button variant="secondary" onClick={() => onEdit?.(f)}>
                    <Icon name="edit" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
export function EnterReading({
  zone = zones[1],
  onBack,
  onSave,
}: {
  zone?: Zone
  onBack?: () => void
  onSave?: (v: Record<string, string>) => void
}) {
  const [unusual, setUnusual] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  return (
    <div className="reading-page">
      <Button variant="text" onClick={onBack}>
        <Icon name="arrow-left" />
        Back to {zone.name}
      </Button>
      <Header
        title="Enter reading"
        subtitle={`${zone.name} · ${zone.crop} · ${zone.type}`}
      />
      <Card className="reading-card">
        <div className="reading-intro">
          <span className="soft-icon">
            <Icon name="sprout" />
          </span>
          <div>
            <h2>A moment to check in</h2>
            <p className="muted">
              Measure your growing bed, then enter the values below.
            </p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const v = Object.fromEntries(
              new FormData(e.currentTarget),
            ) as Record<string, string>
            setValues(v)
            if (
              Number(v.temp) > 45 ||
              Number(v.temp) < 0 ||
              Number(v.soil) > 100 ||
              Number(v.humidity) > 100
            )
              setUnusual(true)
            else onSave?.(v)
          }}
        >
          <div className="reading-fields">
            <Field
              label="Soil moisture"
              name="soil"
              type="number"
              step="any"
              min="0"
              unit="%"
              icon="drop"
              placeholder="e.g. 65"
              required
              hint={`Ideal for ${zone.crop}: ${
                zone.crop === "Lettuce" ? "60–80%" : "50–70%"
              }`}
            />
            <Field
              label="Temperature"
              name="temp"
              type="number"
              step="any"
              unit="°C"
              icon="temp"
              placeholder="e.g. 22"
              required
              hint={`Ideal: ${zone.crop === "Lettuce" ? "15–25" : "21–32"} °C`}
            />
            <Field
              label="Humidity"
              name="humidity"
              type="number"
              min="0"
              step="any"
              unit="%"
              icon="sun"
              placeholder="e.g. 60"
              required
              hint="Ideal: 50–70%"
            />
          </div>
          <div className="form-divider" />
          <Field
            label="Recorded at"
            name="recordedAt"
            type="datetime-local"
            defaultValue="2026-10-10T14:00"
            required
            hint="Change this only if you took the reading earlier."
          />
          <label className="field">
            <span className="field-label">
              Notes <span className="muted">(optional)</span>
            </span>
            <textarea
              name="notes"
              placeholder="Anything you noticed about this bed?"
              rows={3}
            />
          </label>
          {unusual && (
            <div className="unusual-box" role="alert">
              <h3>
                <Icon name="warning" />
                This reading looks unusual. Please check it.
              </h3>
              <p>
                {Number(values.temp) > 45
                  ? "Temperature is above 45 °C."
                  : "A measurement is outside the expected range."}
              </p>
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setUnusual(false)}>
                  Edit values
                </Button>
                <Button onClick={() => onSave?.(values)}>Save anyway</Button>
              </div>
            </div>
          )}
          <Button type="submit" className="save-reading">
            Save and see result
            <Icon name="arrow" />
          </Button>
        </form>
      </Card>
    </div>
  )
}
export function WaterReport({
  onPrint,
  onExport,
  onExportReadings,
}: {
  onPrint?: () => void
  onExport?: () => void
  onExportReadings?: () => void
}) {
  const [farm, setFarm] = useState("All farms")
  const rows = [
    {
      farm: "Gabs farm",
      zone: "garden bed",
      crop: "Siling labuyo",
      readings: 3,
      recommended: 0,
      applied: 25,
    },
    {
      farm: "Louie Farm",
      zone: "Purok 5, Mabini Street",
      crop: "Lettuce",
      readings: 2,
      recommended: 20,
      applied: 22,
    },
  ].filter((r) => farm === "All farms" || r.farm === farm)
  const recommended = rows.reduce((s, r) => s + r.recommended, 0),
    applied = rows.reduce((s, r) => s + r.applied, 0),
    count = rows.reduce((s, r) => s + r.readings, 0)
  return (
    <>
      <Header
        title="Water report"
        subtitle="Water recommended by the system compared with water actually applied."
      >
        <Button onClick={onPrint}>
          <Icon name="print" />
          Print / Save as PDF
        </Button>
        <Button variant="secondary" onClick={onExport}>
          <Icon name="download" />
          Report CSV
        </Button>
        <Button variant="secondary" onClick={onExportReadings}>
          All readings CSV
        </Button>
      </Header>
      <Card className="filter-card">
        <Field label="From date" type="date" defaultValue="2026-10-01" />
        <Field label="To date" type="date" defaultValue="2026-10-10" />
        <Field
          label="Farm"
          select
          options={["All farms", "Gabs farm", "Louie Farm"]}
          onChange={(e) => setFarm(e.target.value)}
        />
      </Card>
      <div className="stat-grid report-stats">
        {[
          { label: "Recommended", value: `${recommended} L` },
          { label: "Applied", value: `${applied} L` },
          { label: "Difference", value: `${applied - recommended} L over` },
          {
            label: "Water applied not recorded",
            value: `0 of ${count}`,
            hint: "readings",
          },
        ].map((s) => (
          <Card className="report-stat" key={s.label}>
            <span className="muted">{s.label}</span>
            <strong>{s.value}</strong>
            {s.hint && <span className="muted">{s.hint}</span>}
          </Card>
        ))}
      </div>
      <Card className="table-card">
        <div className="section-heading">
          <h2>Water use by farm</h2>
          <Icon name="drop" />
        </div>
        <table className="data-table report-table">
          <thead>
            <tr>
              {[
                "Zone",
                "Readings",
                "Not recorded",
                "Recommended",
                "Applied",
                "Difference",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <ReportRows key={r.farm} row={r} />
            ))}
            <tr className="grand-total">
              <td>All farms</td>
              <td data-label="Readings">{count}</td>
              <td data-label="Not recorded">0</td>
              <td data-label="Recommended">{recommended} L</td>
              <td data-label="Applied">{applied} L</td>
              <td data-label="Difference">{applied - recommended} L over</td>
            </tr>
          </tbody>
        </table>
      </Card>
      <p className="report-note">
        <Icon name="report" />
        <span>
          Only readings with water applied recorded are compared. “Over” means
          more water was applied than recommended; “under” means less.
        </span>
      </p>
    </>
  )
}
function ReportRows({
  row: r,
}: {
  row: {
    farm: string
    zone: string
    crop: string
    readings: number
    recommended: number
    applied: number
  }
}) {
  return (
    <>
      <tr className="farm-table-heading">
        <td colSpan={6}>
          <Icon name="leaf" />
          {r.farm}
        </td>
      </tr>
      <tr>
        <td>
          <strong>{r.zone}</strong>
          <span className="table-subtext">{r.crop} · Rooftop</span>
        </td>
        <td data-label="Readings">{r.readings}</td>
        <td data-label="Not recorded">0</td>
        <td data-label="Recommended">{r.recommended} L</td>
        <td data-label="Applied">{r.applied} L</td>
        <td data-label="Difference">{r.applied - r.recommended} L over</td>
      </tr>
      <tr className="farm-total">
        <td>{r.farm} total</td>
        <td data-label="Readings">{r.readings}</td>
        <td data-label="Not recorded">0</td>
        <td data-label="Recommended">{r.recommended} L</td>
        <td data-label="Applied">{r.applied} L</td>
        <td data-label="Difference">{r.applied - r.recommended} L over</td>
      </tr>
    </>
  )
}
export type Account = {
  name: string
  email: string
  role: string
  farms: string
  own: boolean
}
const accounts: Account[] = [
  {
    name: "Super Admin",
    email: "superadmin@sibol.test",
    role: "Super Admin",
    farms: "All farms",
    own: true,
  },
  {
    name: "Louie Jay Due",
    email: "louiejaydue@gmail.com",
    role: "Admin",
    farms: "Louie Farm, Gabs farm",
    own: false,
  },
]
export function Accounts({
  data = accounts,
  state = "ready",
  onCreate,
  onEdit,
  onReset,
  onDeactivate,
  onRetry,
}: {
  data?: Account[]
  state?: ViewState
  onCreate?: () => void
  onEdit?: (a: Account) => void
  onReset?: (a: Account) => void
  onDeactivate?: (a: Account) => void
  onRetry?: () => void
}) {
  return (
    <>
      <Header
        title="Accounts"
        subtitle="Admins work on the farms you assign them. Super Admins manage everything, including these accounts."
      >
        <Button onClick={onCreate}>
          <Icon name="plus" />
          New account
        </Button>
      </Header>
      {state !== "ready" ? (
        <StateView state={state} noun="accounts" onRetry={onRetry} />
      ) : (
        <div className="account-list">
          {data.map((a) => (
            <Card className="account-card" key={a.email}>
              <span className="account-avatar">
                {a.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div className="account-details">
                <div className="account-name">
                  <h2>{a.name}</h2>
                  <span className="role-badge">{a.role}</span>
                  {a.own && <span className="you-badge">You</span>}
                </div>
                <p className="muted">{a.email}</p>
                <p className="icon-line">
                  <Icon name="leaf" />
                  Farms: {a.farms}
                </p>
              </div>
              <div className="account-actions">
                <Button variant="secondary" onClick={() => onEdit?.(a)}>
                  <Icon name="edit" />
                  Edit
                </Button>
                {!a.own && (
                  <>
                    <Button variant="secondary" onClick={() => onReset?.(a)}>
                      Reset password
                    </Button>
                    <Button variant="danger" onClick={() => onDeactivate?.(a)}>
                      Deactivate
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
export const crops = [
  {
    name: "Basil",
    soil: [50, 70],
    temp: [20, 30],
    humidity: [40, 60],
    zones: 0,
  },
  {
    name: "Kangkong",
    soil: [70, 90],
    temp: [24, 35],
    humidity: [60, 85],
    zones: 0,
  },
  {
    name: "Lettuce",
    soil: [60, 80],
    temp: [15, 25],
    humidity: [50, 70],
    zones: 1,
  },
  {
    name: "Pechay",
    soil: [60, 80],
    temp: [18, 30],
    humidity: [60, 80],
    zones: 0,
  },
  {
    name: "Siling labuyo",
    soil: [50, 70],
    temp: [21, 32],
    humidity: [50, 70],
    zones: 1,
  },
  {
    name: "Tomato",
    soil: [60, 80],
    temp: [20, 30],
    humidity: [50, 70],
    zones: 0,
  },
]
function Range({
  values,
  unit,
  max = 100,
}: {
  values: number[]
  unit: string
  max?: number
}) {
  return (
    <div className="range-cell">
      <span>
        {values[0]}–{values[1]}
        {unit}
      </span>
      <div className="range-track">
        <span
          style={{
            marginLeft: `${(values[0] / max) * 100}%`,
            width: `${((values[1] - values[0]) / max) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
export function CropLibrary({
  data = crops,
  onCreate,
  onEdit,
}: {
  data?: typeof crops
  onCreate?: () => void
  onEdit?: (name: string) => void
}) {
  return (
    <>
      <Header
        title="Crop library"
        subtitle="Ideal ranges per crop. Readings are judged against these."
      >
        <Button onClick={onCreate}>
          <Icon name="plus" />
          New crop
        </Button>
      </Header>
      <Card className="table-card">
        <table className="data-table crop-table">
          <thead>
            <tr>
              {[
                "Crop",
                "Soil moisture",
                "Temperature",
                "Humidity",
                "Source",
                "Zones",
                "Edit",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.name}>
                <td>
                  <span className="crop-name">
                    <span className="soft-icon">
                      <Icon name="sprout" />
                    </span>
                    <strong>{c.name}</strong>
                  </span>
                </td>
                <td data-label="Soil moisture">
                  <Range values={c.soil} unit="%" />
                </td>
                <td data-label="Temperature">
                  <Range values={c.temp} unit=" °C" max={50} />
                </td>
                <td data-label="Humidity">
                  <Range values={c.humidity} unit="%" />
                </td>
                <td data-label="Source">
                  <span className="source-label">Provisional (uncited)</span>
                </td>
                <td data-label="Zones">{c.zones}</td>
                <td>
                  <Button
                    variant="text"
                    onClick={() => onEdit?.(c.name)}
                    aria-label={`Edit ${c.name}`}
                  >
                    <Icon name="edit" />
                    <span className="mobile-only">Edit crop</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
const activities = [
  {
    day: "October 10, 2026",
    action: "Edited a reading of garden bed",
    farm: "Gabs farm",
    actor: "Louie Jay Due",
    time: "12:07 PM",
    category: "Readings",
    icon: "edit",
    change: "5",
  },
  {
    day: "October 9, 2026",
    action: "Edited a reading of garden bed",
    farm: "Gabs farm",
    actor: "Super Admin",
    time: "12:48 AM",
    category: "Readings",
    icon: "edit",
    change: "10",
  },
  {
    day: "October 8, 2026",
    action: "Added the zone garden bed to Gabs farm",
    farm: "",
    actor: "Louie Jay Due",
    time: "6:57 PM",
    category: "Zones",
    icon: "sprout",
    change: "",
  },
  {
    day: "October 8, 2026",
    action: "Created the farm Gabs farm",
    farm: "",
    actor: "Super Admin",
    time: "6:54 PM",
    category: "Farms",
    icon: "leaf",
    change: "",
  },
]
export function ActivityLog({
  data = activities,
  state = "ready",
  onRetry,
  onPage,
}: {
  data?: typeof activities
  state?: ViewState
  onRetry?: () => void
  onPage?: (direction: string) => void
}) {
  const [filter, setFilter] = useState("Everything")
  const filtered = data.filter(
    (a) => filter === "Everything" || a.category === filter,
  )
  return (
    <>
      <Header
        title="Activity log"
        subtitle="A record of changes to accounts, farms, crops, zones and readings."
      />
      <div className="activity-filter">
        <Field
          label="Show"
          select
          options={[
            "Everything",
            "Accounts",
            "Farms",
            "Crop library",
            "Zones",
            "Readings",
          ]}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {state !== "ready" ? (
        <StateView state={state} noun="activity" onRetry={onRetry} />
      ) : filtered.length === 0 ? (
        <StateView state="empty" noun="activity" />
      ) : (
        <div className="activity-days">
          {Array.from(new Set(filtered.map((a) => a.day))).map((day) => (
            <section key={day}>
              <h2 className="activity-date">{day}</h2>
              <Card className="activity-card">
                {filtered
                  .filter((a) => a.day === day)
                  .map((a, i) => (
                    <div className="activity-entry" key={i}>
                      <span className="soft-icon">
                        <Icon name={a.icon} />
                      </span>
                      <div className="activity-copy">
                        <h3>
                          {a.action}
                          {a.farm && <span className="muted"> ({a.farm})</span>}
                        </h3>
                        <p className="muted">
                          {a.actor}
                          <span className="dot-separator">·</span>
                          {a.time}
                        </p>
                        {a.change && (
                          <div className="change-values">
                            <span>Water applied (L)</span>
                            <span className="old-value">empty</span>
                            <Icon name="arrow" />
                            <strong>{a.change}</strong>
                          </div>
                        )}
                      </div>
                      <span className="activity-category">{a.category}</span>
                    </div>
                  ))}
              </Card>
            </section>
          ))}
        </div>
      )}
      <div className="pagination">
        <Button variant="secondary" onClick={() => onPage?.("previous")}>
          <Icon name="arrow-left" />
          Previous
        </Button>
        <Button variant="secondary" onClick={() => onPage?.("next")}>
          Next
          <Icon name="arrow" />
        </Button>
      </div>
    </>
  )
}
