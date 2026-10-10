import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
} from "react"

const paths: Record<string, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C10 2 3 7 5 14s13 6 15-10Z" />
      <path d="M4 21 15 10" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 22V12M12 13C4 14 2 8 3 4c6 0 9 3 9 9ZM12 10c0-6 4-8 9-8 1 5-2 9-9 8Z" />
    </>
  ),
  report: (
    <>
      <path d="M5 3h10l4 4v14H5Z" />
      <path d="M14 3v5h5M9 17v-4m4 4V10m4 7v-5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  drop: <path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 10 18H2Z" />
      <path d="M12 9v5m0 3v.1" />
    </>
  ),
  temp: (
    <>
      <path d="M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Z" />
      <path d="M12 7v11" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  "arrow-left": <path d="M19 12H5m6-6-6 6 6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  pin: (
    <>
      <path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="9" r="2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H4v16h6m-1-8h12m-4-4 4 4-4 4" />
    </>
  ),
  edit: (
    <>
      <path d="m16 3 5 5L9 20l-6 1 1-6Z" />
      <path d="m14 5 5 5" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  print: (
    <>
      <path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V3H3v13h5" />
    </>
  ),
}
export function Icon({
  name,
  className = "",
}: {
  name: string
  className?: string
}) {
  return (
    <svg
      className={`icon ${className}`}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.leaf}
    </svg>
  )
}
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return (
    <button
      type="button"
      {...props}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  )
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`card ${className}`}>{children}</section>
}
export function Header({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      <div className="header-actions">{children}</div>
    </header>
  )
}
export function Badge({ status }: { status: string }) {
  const kind =
    status === "Optimal"
      ? "optimal"
      : status === "Too Dry"
        ? "dry"
        : status === "Too Wet"
          ? "wet"
          : status === "No readings yet"
            ? "none"
            : status === "Too Hot"
              ? "hot"
              : "warning"
  return (
    <span className={`badge badge-${kind}`}>
      <Icon
        name={
          kind === "optimal"
            ? "check"
            : kind === "dry" || kind === "wet"
              ? "drop"
              : kind === "none"
                ? "clock"
                : "warning"
        }
      />
      {status}
    </span>
  )
}
export function Field({
  label,
  hint,
  unit,
  icon,
  select,
  options,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  unit?: string
  icon?: string
  select?: boolean
  options?: string[]
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={`field-control ${icon ? "with-icon" : ""}`}>
        {icon && <Icon name={icon} />}
        {select ? (
          <select
            name={props.name}
            defaultValue={props.defaultValue}
            onChange={props.onChange as never}
          >
            {options?.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input {...props} />
        )}
        {unit && <span className="unit">{unit}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <Button variant="text" onClick={onClose} aria-label="Close window">
          <Icon name="close" />
        </Button>
      </div>
      {children}
    </dialog>
  )
}
export type ViewState = "ready" | "loading" | "empty" | "error"
export function StateView({
  state,
  noun,
  onRetry,
}: {
  state: ViewState
  noun: string
  onRetry?: () => void
}) {
  if (state === "ready") return null
  return (
    <Card className="state-view">
      <Icon
        name={
          state === "error"
            ? "warning"
            : state === "loading"
              ? "refresh"
              : "sprout"
        }
      />
      <h2>
        {state === "loading"
          ? `Loading ${noun}…`
          : state === "error"
            ? `Could not load ${noun}`
            : `No ${noun} yet`}
      </h2>
      <p className="muted">
        {state === "empty"
          ? noun === "activity"
            ? "Changes will appear here when you add or update farms, zones, crops or readings."
            : `Add ${
                noun === "zones"
                  ? "a farm and a zone, then enter a reading"
                  : noun === "accounts"
                    ? "an account and assign farms"
                    : "a farm to get started"
              }.`
          : state === "error"
            ? "Please try again."
            : "Getting your information ready."}
      </p>
      {state === "error" && <Button onClick={onRetry}>Try again</Button>}
    </Card>
  )
}
const nav = [
  { name: "Dashboard", icon: "grid" },
  { name: "Farms", icon: "leaf" },
  { name: "Water report", icon: "report" },
  { name: "Accounts", icon: "users" },
  { name: "Crop library", icon: "sprout" },
  { name: "Activity log", icon: "clock" },
]
export function AppShell({
  children,
  page,
  onNavigate,
  attention = 1,
  onPassword,
  onLogout,
  role = "Super Admin",
}: {
  children: ReactNode
  page: string
  onNavigate: (p: string) => void
  attention?: number
  onPassword: () => void
  onLogout: () => void
  role?: string
}) {
  const [more, setMore] = useState(false)
  const item = (n: typeof nav[number]) => (
    <button
      key={n.name}
      className={`nav-item ${
        page === n.name || (n.name === "Farms" && page === "Farm")
          ? "active"
          : ""
      }`}
      onClick={() => {
        onNavigate(n.name)
        setMore(false)
      }}
    >
      <Icon name={n.icon} />
      <span>{n.name}</span>
      {n.name === "Dashboard" && attention > 0 && (
        <span className="nav-count">{attention}</span>
      )}
    </button>
  )
  const logo = (
    <div className="brand">
      <span className="brand-symbol">
        <Icon name="sprout" />
      </span>
      <span>
        Sibol<span className="brand-dot">.</span>
      </span>
    </div>
  )
  return (
    <div className="sibol-app">
      <aside className="sidebar">
        {logo}
        <div className="sidebar-divider" />
        <nav className="main-nav">
          {nav.slice(0, 3).map(item)}
          {role === "Super Admin" && (
            <>
              <p className="nav-label">MANAGE</p>
              {nav.slice(3).map(item)}
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-info">
            <span className="avatar">SA</span>
            <div>
              <strong>Super Admin</strong>
              <span>{role}</span>
            </div>
          </div>
          <button className="sidebar-action" onClick={onPassword}>
            <Icon name="lock" />
            Change password
          </button>
          <button className="sidebar-action" onClick={onLogout}>
            <Icon name="logout" />
            Log out
          </button>
        </div>
        <span className="sidebar-decoration" aria-hidden="true">
          <Icon name="sprout" />
        </span>
      </aside>
      <div className="mobile-header">
        {logo}
        <span className="avatar">SA</span>
      </div>
      <div className="workspace">
        <div className="topline">
          <span>
            <Icon name="sprout" /> A little care. A little growth.
          </span>
          <span className="role-label">SUPER ADMIN WORKSPACE</span>
        </div>
        <main className="main-content">{children}</main>
        <footer className="app-footer">
          <span>Sibol · Growing with care</span>
          <span>All readings are entered by hand.</span>
        </footer>
      </div>
      <nav className="mobile-tabs">
        {nav.slice(0, 3).map((n) => (
          <button
            key={n.name}
            className={page === n.name ? "active" : ""}
            onClick={() => onNavigate(n.name)}
          >
            <Icon name={n.icon} />
            {n.name}
          </button>
        ))}
        <button onClick={() => setMore(true)}>
          <Icon name="more" />
          More
        </button>
      </nav>
      {more && (
        <Modal title="More" onClose={() => setMore(false)}>
          <div className="more-links">
            {role === "Super Admin" && nav.slice(3).map(item)}
            <Button
              variant="text"
              onClick={() => {
                setMore(false)
                onPassword()
              }}
            >
              <Icon name="lock" />
              Change password
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setMore(false)
                onLogout()
              }}
            >
              <Icon name="logout" />
              Log out
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
