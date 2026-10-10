import { useState, type ReactNode, type ButtonHTMLAttributes } from "react"
import {
  AppShell,
  Button,
  Icon,
  Modal,
  Field,
  Header,
  Badge,
  StateView,
  type ViewState,
} from "./components"
import {
  Dashboard,
  Farms,
  EnterReading,
  WaterReport,
  Accounts,
  CropLibrary,
  ActivityLog,
  zones,
  farms,
  type Zone,
  type Farm,
} from "./screens"

export default function App() {
  const [page, setPage] = useState("Dashboard")
  const [zone, setZone] = useState<Zone>(zones[1])
  const [zoneData, setZoneData] = useState(zones)
  const [farmData, setFarmData] = useState(farms)
  const [window, setWindow] = useState("")
  const [selectedFarm, setSelectedFarm] = useState<Farm>(farms[0])
  const [notice, setNotice] = useState<ReactNode>(null)
  const [accountData, setAccountData] = useState([
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
  ])
  const [temporary, setTemporary] = useState({ email: "", password: "" })
  const [copied, setCopied] = useState(false)
  const [viewState] = useState<ViewState>("ready")
  const navigate = (next: string) => {
    setPage(next)
    setNotice(null)
  }
  const enter = (item: Zone) => {
    setZone(item)
    navigate("Enter reading")
  }
  const download = (all = false) => {
    const content = all
      ? "Farm,Zone,Soil moisture,Temperature,Humidity\n" +
        zoneData
          .map((z) => `${z.farm},"${z.name}",${z.soil},${z.temp},${z.humidity}`)
          .join("\n")
      : "Farm,Recommended,Applied,Difference\nGabs farm,0,25,25\nLouie Farm,20,22,2\nAll farms,20,47,27"
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = all ? "sibol-readings.csv" : "sibol-water-report.csv"
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <AppShell
      page={page}
      onNavigate={navigate}
      attention={zoneData.filter((z) => z.status === "Too Dry").length}
      onPassword={() => setWindow("password")}
      onLogout={() => setWindow("logout")}
    >
      {notice && (
        <div className="notice" role="status">
          <Icon name="check" />
          {notice}
          <Button
            variant="text"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
          >
            <Icon name="close" />
          </Button>
        </div>
      )}
      {page === "Dashboard" && (
        <Dashboard
          data={zoneData}
          state={viewState}
          onEnter={enter}
          onAdvice={(z) => {
            setZone(z)
            setWindow("advice")
          }}
          onRefresh={() =>
            setNotice(
              "Readings refreshed. All measurements are entered by hand.",
            )
          }
          onRetry={() => {}}
        />
      )}
      {page === "Farms" && (
        <Farms
          data={farmData}
          state={viewState}
          onCreate={() => setWindow("farm")}
          onEdit={(f) => {
            setSelectedFarm(f)
            setWindow("edit farm")
          }}
          onOpen={(f) => {
            setSelectedFarm(f)
            navigate("Farm")
          }}
        />
      )}
      {page === "Farm" && (
        <>
          <Button variant="text" onClick={() => navigate("Farms")}>
            <Icon name="arrow-left" />
            Back to farms
          </Button>
          <Header
            title={selectedFarm.name}
            subtitle={`${selectedFarm.location} · Admin: ${selectedFarm.admins}`}
          />
          <Dashboard
            data={zoneData.filter((z) => z.farm === selectedFarm.name)}
            compact
            onEnter={enter}
            onAdvice={(z) => {
              setZone(z)
              setWindow("advice")
            }}
          />
        </>
      )}
      {page === "Enter reading" && (
        <EnterReading
          zone={zone}
          onBack={() => navigate("Dashboard")}
          onSave={(values) => {
            const soil = Number(values.soil)
            const status =
              soil < (zone.crop === "Lettuce" ? 60 : 50)
                ? "Too Dry"
                : soil > (zone.crop === "Lettuce" ? 80 : 70)
                  ? "Too Wet"
                  : "Optimal"
            setZoneData(
              zoneData.map((z) =>
                z.name === zone.name
                  ? {
                      ...z,
                      soil,
                      temp: Number(values.temp),
                      humidity: Number(values.humidity),
                      status,
                      updated: "Just now",
                    }
                  : z,
              ),
            )
            setNotice(
              <>
                <strong>{status}.</strong>{" "}
                {status === "Too Dry"
                  ? "Water now: apply about 20 L."
                  : status === "Optimal"
                    ? "Your soil moisture is within the ideal range."
                    : "Do not water yet. Let the soil dry into its ideal range."}
              </>,
            )
            setPage("Dashboard")
          }}
        />
      )}
      {page === "Water report" && (
        <WaterReport
          onPrint={() => globalThis.print()}
          onExport={() => download()}
          onExportReadings={() => download(true)}
        />
      )}
      {page === "Accounts" && (
        <Accounts
          data={accountData}
          state={viewState}
          onCreate={() => setWindow("account")}
          onEdit={(a) => {
            setTemporary({ email: a.email, password: "" })
            setWindow("edit account")
          }}
          onReset={(a) => {
            setTemporary({
              email: a.email,
              password: "Sibol-" + crypto.randomUUID().slice(0, 8),
            })
            setWindow("temporary")
          }}
          onDeactivate={(a) => {
            setTemporary({ email: a.email, password: "" })
            setWindow("deactivate")
          }}
        />
      )}
      {page === "Crop library" && (
        <CropLibrary
          onCreate={() => setWindow("crop")}
          onEdit={(name) => {
            setNotice(`Editing ${name}`)
            setWindow("crop")
          }}
        />
      )}
      {page === "Activity log" && <ActivityLog state={viewState} />}
      {window && (
        <Modal
          title={
            ({
              advice: "Watering advice",
              password: "Change password",
              logout: "Log out of Sibol?",
              farm: "New farm",
              "edit farm": "Edit farm",
              account: "New account",
              "edit account": "Edit account",
              temporary: "Temporary password",
              deactivate: "Deactivate Louie Jay Due?",
              crop: "New crop",
            } as Record<string, string>)[window]
          }
          onClose={() => setWindow("")}
        >
          {window === "advice" && (
            <>
              <Badge status={zone.status} />
              <h3 className="modal-zone">{zone.name}</h3>
              <p className="muted">
                {zone.crop} · {zone.farm}
              </p>
              <div className="advice-box">
                <Icon name="drop" />
                <p>
                  {zone.status === "Too Dry"
                    ? "Water now: apply about 20 L"
                    : "No water needed right now. Soil moisture is within the ideal range."}
                </p>
              </div>
              <p className="muted">
                Advice is based on your last manually entered reading and the
                ideal ranges for this crop.
              </p>
              <Button
                onClick={() => {
                  setWindow("")
                  enter(zone)
                }}
              >
                Enter reading
              </Button>
            </>
          )}
          {window === "temporary" && (
            <>
              <p className="muted">{temporary.email}</p>
              <div className="password-display">{temporary.password}</div>
              <p className="warning-text">
                Copy it now. This password is not shown again.
              </p>
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(temporary.password)
                  setCopied(true)
                }}
              >
                <Icon name="copy" />
                {copied ? "Copied" : "Copy password"}
              </Button>
            </>
          )}
          {window === "deactivate" && (
            <>
              <p className="muted">
                This account will no longer be able to access its assigned
                farms.
              </p>
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setWindow("")}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setAccountData(
                      accountData.filter((a) => a.email !== temporary.email),
                    )
                    setWindow("")
                  }}
                >
                  Deactivate
                </Button>
              </div>
            </>
          )}
          {window === "logout" && (
            <>
              <p className="muted">Are you sure you want to log out?</p>
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setWindow("")}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setWindow("")
                    setNotice("Log out requested.")
                  }}
                >
                  Log out
                </Button>
              </div>
            </>
          )}
          {[
            "account",
            "edit account",
            "farm",
            "edit farm",
            "crop",
            "password",
          ].includes(window) && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const f = new FormData(e.currentTarget)
                if (window === "account") {
                  const email = String(f.get("email"))
                  setAccountData([
                    ...accountData,
                    {
                      name: String(f.get("name")),
                      email,
                      role: String(f.get("role")),
                      farms: f.getAll("farms").join(", ") || "All farms",
                      own: false,
                    },
                  ])
                  setTemporary({
                    email,
                    password: "Sibol-" + crypto.randomUUID().slice(0, 8),
                  })
                  setCopied(false)
                  setWindow("temporary")
                } else if (window.includes("farm")) {
                  const next = {
                    name: String(f.get("name")),
                    location: String(f.get("location")),
                    admins: "Louie Jay Due",
                    zones: 0,
                  }
                  setFarmData(
                    window === "farm"
                      ? [...farmData, next]
                      : farmData.map((item) =>
                          item.name === selectedFarm.name ? next : item,
                        ),
                  )
                  setWindow("")
                } else {
                  setWindow("")
                  setNotice("Changes saved.")
                }
              }}
            >
              {window.includes("account") && (
                <>
                  <Field label="Full name" name="name" required />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={
                      window === "edit account" ? temporary.email : ""
                    }
                    required
                  />
                  <Field
                    label="Role"
                    name="role"
                    select
                    options={["Admin", "Super Admin"]}
                    hint="A Super Admin can manage accounts, farms and the crop library, and sees every farm."
                  />
                  <fieldset className="checklist">
                    <legend>Assigned farms</legend>
                    {farmData.map((f) => (
                      <label key={f.name}>
                        <input type="checkbox" name="farms" value={f.name} />
                        {f.name}
                      </label>
                    ))}
                  </fieldset>
                  <p className="muted">
                    A temporary password is generated and shown to you after
                    saving.
                  </p>
                </>
              )}
              {window.includes("farm") && (
                <>
                  <Field
                    label="Farm name"
                    name="name"
                    defaultValue={
                      window === "edit farm" ? selectedFarm.name : ""
                    }
                    required
                  />
                  <Field
                    label="Location"
                    name="location"
                    defaultValue={
                      window === "edit farm" ? selectedFarm.location : ""
                    }
                    required
                  />
                </>
              )}
              {window === "crop" && (
                <>
                  <Field label="Crop name" name="name" required />
                  {[
                    "Soil moisture (%)",
                    "Temperature (°C)",
                    "Humidity (%)",
                  ].map((label, i) => (
                    <div key={label}>
                      <p className="field-label">{label}</p>
                      <div className="two-fields">
                        <Field
                          label="Minimum"
                          name={`min${i}`}
                          type="number"
                          required
                        />
                        <Field
                          label="Maximum"
                          name={`max${i}`}
                          type="number"
                          required
                        />
                      </div>
                    </div>
                  ))}
                  <Field
                    label="Source of these ranges"
                    name="source"
                    placeholder="e.g. DA, PhilRice, a university extension guide"
                  />
                  <p className="muted">
                    Changing these ranges affects new readings only. Past
                    readings keep the status they were given.
                  </p>
                </>
              )}
              {window === "password" && (
                <>
                  <Field label="Current password" type="password" required />
                  <Field
                    label="New password"
                    type="password"
                    minLength={8}
                    required
                  />
                  <Field
                    label="Confirm new password"
                    type="password"
                    minLength={8}
                    required
                  />
                </>
              )}
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setWindow("")}>
                  Cancel
                </Button>
                <Button type="submit">
                  {window === "account"
                    ? "Create account"
                    : window === "crop"
                      ? "Save crop"
                      : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </AppShell>
  )
}
