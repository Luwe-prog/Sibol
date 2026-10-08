// Inline SVG icons: 24×24, drawn with the current text color.

function Icon({ children, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

const THERMOMETER = 'M8 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0Z'
const WIND = 'M3 8h8a2.5 2.5 0 1 0-2.5-2.5M3 12h10M3 16h6'
const CIRCLE = 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0'

// The app's icon set: one path each on a 24 × 24 grid.
// There are deliberately no Wi-Fi, signal, battery or "live" icons: Sibol has no sensors.
const PATHS = {
  dashboard: 'M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z',
  sprout: 'M12 21v-9M12 12C12 8.5 9.5 6 5 6c0 4 2.5 6 7 6ZM12 10c0-3.5 2.5-6 7-6 0 4-2.5 6-7 6ZM7 21h10',
  report: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 17v-3M12 17v-6M16 17v-2',
  users:
    'M15 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 3 18.5V20M9 11.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7ZM21 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.6a3.5 3.5 0 0 1 0 6.8',
  book: 'M3 5.5A1.5 1.5 0 0 1 4.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5h-5A1.5 1.5 0 0 1 3 16ZM21 5.5A1.5 1.5 0 0 0 19.5 4H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5h5A1.5 1.5 0 0 0 21 16Z',
  history: 'M3 12a9 9 0 1 0 2.6-6.4L3 8M3 3v5h5M12 7v5l3 2',
  menu: 'M4 6h16M4 12h16M4 18h16',
  'log-out': 'M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9',
  key: 'M7.5 19a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7ZM10 13.5 19 4.5M16 7.5l2.5 2.5M13.5 10l2 2',
  user: 'M20 21v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V21M12 11.5a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z',
  shield: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6Z',
  refresh: 'M20 11a8 8 0 0 0-14.6-4.5L4 8M4 3v5h5M4 13a8 8 0 0 0 14.6 4.5L20 16M20 21v-5h-5',
  plus: 'M12 5v14M5 12h14',
  pencil: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  upload: 'M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  download: 'M12 4v11M7 10l5 5 5-5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  printer: 'M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z',
  file: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6',
  copy: 'M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2ZM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  filter: 'M3 5h18l-7 8.5V19l-4 2v-7.5Z',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3 10h18M8 3v4M16 3v4',
  'map-pin': 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z',
  rooftop: 'M5 21V10h14v11M3 21h18M9 14h2M13 14h2M9 17.5h2M13 17.5h2M12 10V7M12 8c0-1.9 1.3-3.5 3.5-3.5 0 2-1.4 3.5-3.5 3.5Z',
  indoor: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5',
  droplet: 'M12 3S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 3 12 3Z',
  thermometer: THERMOMETER,
  wind: WIND,
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.2 1.1 2V16h5v-.2c0-.8.4-1.5 1.1-2A6 6 0 0 0 12 3Z',
  'too-dry': 'M12 3.5S5.5 10.5 5.5 15a6.5 6.5 0 0 0 13 0c0-4.5-6.5-11.5-6.5-11.5ZM4 4l16 16',
  optimal: `${CIRCLE}M8 12.5l2.7 2.7L16 10`,
  'too-wet': 'M12 2.5S7.5 7.5 7.5 11a4.5 4.5 0 0 0 9 0c0-3.5-4.5-8.5-4.5-8.5ZM3 20c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0',
  'too-cold': `${THERMOMETER}M18 4v7M15.5 8.5 18 11l2.5-2.5`,
  'too-hot': `${THERMOMETER}M18 11V4M15.5 6.5 18 4l2.5 2.5`,
  'humidity-low': `${WIND}M19 8v8M16.5 13.5 19 16l2.5-2.5`,
  'humidity-high': `${WIND}M19 16V8M16.5 10.5 19 8l2.5 2.5`,
  warning: 'M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0ZM12 9.5v4M12 17h.01',
  clock: `${CIRCLE}M12 7v5l3 2`,
  'minus-circle': `${CIRCLE}M8 12h8`,
  ban: `${CIRCLE}M5.6 5.6l12.8 12.8`,
  'alert-circle': `${CIRCLE}M12 7.5v5M12 16h.01`,
  info: `${CIRCLE}M12 11v5M12 7.5h.01`,
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
}

// <AppIcon name="droplet" className="h-5 w-5" />. Decorative by default: the words beside it carry the meaning.
export function AppIcon({ name, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

// The Sibol logo, served from frontend/public/logo.png (192 px, transparent corners).
// The full-size original is kept in frontend/design/logo-original.png.
// Every place the logo appears uses this component, so replacing that one file changes them all.
export function SibolMark({ 'aria-hidden': ariaHidden, ...props }) {
  // Beside the word "Sibol" the picture adds nothing for a screen reader, so it gets an empty alt.
  return <img src="/logo.png" alt={ariaHidden ? '' : 'Sibol'} aria-hidden={ariaHidden} draggable={false} {...props} />
}

export function Eye(props) {
  return (
    <Icon {...props}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  )
}

export function EyeOff(props) {
  return (
    <Icon {...props}>
      <path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6" />
      <path d="M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </Icon>
  )
}

export function Info(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </Icon>
  )
}

export function Clock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  )
}

export function AlertCircle(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16h.01" />
    </Icon>
  )
}

export function UserX(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M17 8l5 5" />
      <path d="M22 8l-5 5" />
    </Icon>
  )
}

export function WifiOff(props) {
  return (
    <Icon {...props}>
      <path d="M3 3l18 18" />
      <path d="M8.5 16.4a5 5 0 0 1 7 0" />
      <path d="M5 12.9a10 10 0 0 1 5.2-2.7" />
      <path d="M19 12.9a10 10 0 0 0-2.1-1.5" />
      <path d="M2 8.8a15 15 0 0 1 4.2-2.6" />
      <path d="M22 8.8a15 15 0 0 0-11.3-3.7" />
      <path d="M12 20h.01" />
    </Icon>
  )
}

export function Mail(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </Icon>
  )
}

export function Lock(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2" />
    </Icon>
  )
}

export function ArrowRight(props) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Icon>
  )
}

export function Droplet(props) {
  return (
    <Icon {...props}>
      <path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.200 12 3 12 3Z" />
    </Icon>
  )
}

export function Thermometer(props) {
  return (
    <Icon {...props}>
      <path d="M14 14.8V5a2 2 0 0 0-4 0v9.800a4 4 0 1 0 4 0Z" />
      <path d="M12 9v8" />
    </Icon>
  )
}

export function Leaf(props) {
  return (
    <Icon {...props}>
      <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
      <path d="M5 19c2-5 5-8 9-10" />
    </Icon>
  )
}

export function Spinner(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
