import '@fontsource-variable/dm-sans'
import { useEffect, useRef, useState } from 'react'
import { SibolMark } from '../components/icons.jsx'
import { useAuth } from '../context/useAuth.js'
import './login.css'

// Layout and wording come from the Figma Make design;
// its styles are in login.css, all under the .login-page class.
// The login behavior is the app's own: real requests, real errors, a real countdown.

const YEAR = new Date().getFullYear()

// What to show for each way a login can fail.
const ERRORS = {
  wrong: { title: 'The email or password is incorrect.', detail: 'Check for typing mistakes and try again.' },
  deactivated: { title: 'This account has been deactivated.', detail: 'Ask your Super Admin to turn it back on.' },
  throttled: { title: 'Too many tries.', detail: 'Please wait 1 minute, then try again.' },
  unreachable: { title: 'Cannot reach the server.', detail: 'Check that the backend is running.' },
  other: { title: 'Something went wrong.', detail: 'Please try again.' },
}

const errorKind = (error) => {
  if (!error.response) return 'unreachable'
  if (error.response.status === 429) return 'throttled'
  if (error.response.data?.code === 'account_deactivated') return 'deactivated'
  if (error.response.status === 422) return 'wrong'
  return 'other'
}

// 45 -> "0:45"
const mmss = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

const ICON_PATHS = {
  leaf: (
    <>
      <path d="M19 4C9 3 3 9 6 15s13 3 13-11Z" />
      <path d="M5 20 15 9M9 16v-5m0 5h5" />
    </>
  ),
  sprout: <path d="M12 21v-9M12 15C4 15 3 9 3 6c6 0 9 3 9 9ZM12 12c0-7 5-9 9-9 0 6-3 9-9 9ZM6 21h12" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  hide: <path d="m3 3 18 18M10 5c7-1 12 7 12 7a21 21 0 0 1-4 5M6 6a22 22 0 0 0-4 6s4 7 10 7a12 12 0 0 0 4-1" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  drop: <path d="M12 3C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-12ZM8 15a4 4 0 0 0 4 4" />,
  status: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  readings: <path d="M8 3v11a4 4 0 1 0 5 0V3a2.5 2.5 0 0 0-5 0ZM17 5h4m-4 5h3M10.5 9v8" />,
}

function Icon({ name, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

const FEATURES = [
  ['readings', '3 readings', 'Soil, temperature, humidity'],
  ['status', 'Clear status', 'Too Dry, Optimal or Too Wet'],
  ['drop', 'Liters to apply', 'The right amount for each bed'],
]

export default function LoginPage() {
  const { login } = useAuth()
  const passwordRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errorKey, setErrorKey] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // Seconds left before another try is allowed, after too many failed ones.
  const [waitSeconds, setWaitSeconds] = useState(0)

  const error = errorKey ? ERRORS[errorKey] : null
  const invalid = errorKey === 'wrong'
  const waiting = waitSeconds > 0

  useEffect(() => {
    document.title = 'Log in · Sibol'
    return () => {
      document.title = 'Sibol'
    }
  }, [])

  // Count the wait down once a second. At zero the button returns and the banner clears.
  useEffect(() => {
    if (waitSeconds <= 0) return undefined

    const timer = setTimeout(() => {
      setWaitSeconds((current) => current - 1)
      if (waitSeconds === 1) {
        setErrorKey((current) => (current === 'throttled' ? null : current))
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [waitSeconds])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting || waiting) return
    setErrorKey(null)
    setSubmitting(true)

    try {
      // On success the route guards redirect, so there is nothing more to do here.
      await login(email, password)
    } catch (err) {
      const kind = errorKind(err)
      setErrorKey(kind)
      setSubmitting(false)

      if (kind === 'throttled') {
        const retryAfter = Number(err.response.headers?.['retry-after'])
        setWaitSeconds(retryAfter > 0 ? Math.ceil(retryAfter) : 60)
      }

      // The email is kept so only the password has to be retyped. When the server could
      // not be reached, both are kept, so trying again is one tap.
      if (kind === 'wrong' || kind === 'deactivated') {
        setPassword('')
      }
      if (kind === 'wrong') {
        passwordRef.current?.focus()
      }
    }
  }

  const wrapClass = invalid ? 'input-wrap invalid' : 'input-wrap'
  const buttonClass = waiting ? 'submit-button rate-limited' : submitting ? 'submit-button is-busy' : 'submit-button'

  return (
    <main className="login-page">
      <section className="photo-panel" aria-label="Welcome to Sibol">
        <div className="photo-image" />
        <div className="photo-shade" />
        <div className="mobile-brand">
          <SibolMark aria-hidden="true" className="logo-tile" />
          <span>Sibol</span>
        </div>
        <div className="photo-content">
          <span className="leaf-badge">
            <Icon name="leaf" />
          </span>
          <p className="photo-eyebrow">A LITTLE CARE. A LITTLE GROWTH.</p>
          <p className="photo-heading">
            Welcome back <br />
            to Sibol.
          </p>
          <span className="photo-rule" />
          <p className="photo-description">
            Enter your readings, see how each bed is doing, and give your plants the right amount of water.
          </p>
        </div>
        <div className="feature-strip">
          {FEATURES.map(([icon, title, description]) => (
            <div className="feature" key={title}>
              <Icon name={icon} />
              <strong>{title}</strong>
              <span>{description}</span>
            </div>
          ))}
        </div>
        <div className="photo-caption">
          <span className="caption-line" /> Rooted in care. Growing together.
        </div>
        <Icon name="leaf" className="leaf-decoration" />
      </section>

      <section className="form-panel" aria-label="Log in to Sibol">
        <div className="form-content">
          <header className="brand">
            <SibolMark aria-hidden="true" className="logo-tile" />
            <span className="wordmark">Sibol</span>
            <p className="brand-description">Watering guide for rooftop and indoor farms</p>
            <span className="brand-rule" />
          </header>

          <form className="login-form" onSubmit={handleSubmit} aria-busy={submitting}>
            <div className="form-heading">
              <h1>Welcome back</h1>
              <p>Log in to check your beds.</p>
            </div>

            {/* Always in the page, so a screen reader announces the banner when it appears. */}
            <div id="login-alert" role="alert" aria-atomic="true">
              {error && (
                <div className="error-banner">
                  <Icon name={errorKey === 'throttled' ? 'clock' : 'info'} />
                  <div>
                    <p className="error-title">{error.title}</p>
                    <p>{error.detail}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <div className={wrapClass}>
                <Icon name="mail" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Enter your email address"
                  readOnly={submitting}
                  aria-invalid={invalid}
                  aria-describedby={error ? 'login-alert' : undefined}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className={wrapClass}>
                <Icon name="lock" />
                <input
                  id="password"
                  name="password"
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  ref={passwordRef}
                  readOnly={submitting}
                  aria-invalid={invalid}
                  aria-describedby={error ? 'login-alert' : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-controls="password"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  aria-pressed={show}
                >
                  <Icon name={show ? 'hide' : 'eye'} />
                </button>
              </div>
            </div>

            <button className={buttonClass} type="submit" disabled={submitting || waiting}>
              {submitting ? (
                <>
                  <span>Logging in…</span>
                  <span className="spinner" aria-hidden="true" />
                </>
              ) : waiting ? (
                <>
                  <Icon name="clock" />
                  <span>Try again in {mmss(waitSeconds)}</span>
                </>
              ) : (
                <>
                  <span>Log in</span>
                  <Icon name="arrow" />
                </>
              )}
            </button>
            <span className="sr-only" aria-live="polite">
              {submitting ? 'Logging in…' : ''}
            </span>

            <p className="account-note">
              <Icon name="info" />
              <span>
                Need an account or a password reset? <br />
                Ask your Super Admin.
              </span>
            </p>
          </form>

          {/* Plain links, so the page also works where no router is present (the tests). */}
          <div className="learn-card">
            <span className="learn-icon">
              <Icon name="sprout" />
            </span>
            <div>
              <p>New to Sibol?</p>
              <a href="/">
                See how it works <Icon name="arrow" />
              </a>
            </div>
            <Icon name="leaf" className="card-leaf" />
          </div>

          <footer className="footer">
            <a href="/">
              See how Sibol works <Icon name="arrow" />
            </a>
            <span>© {YEAR} Sibol</span>
          </footer>
        </div>
      </section>
    </main>
  )
}
