import { useState } from "react"
import type { FormEvent, ReactNode } from "react"

export type LoginState = "empty" | "focused" | "submitting" | "wrong-details" | "deactivated" | "too-many-tries" | "server-unreachable"
export interface LoginPageProps {
  state?: LoginState
  onSubmit?: (email: string, password: string) => void
}

const messages: Partial<Record<LoginState, string>> = {
  "wrong-details":
    "The email or password is incorrect. Check for typing mistakes and try again.",
  deactivated:
    "This account has been deactivated. Ask your Super Admin to turn it back on.",
  "too-many-tries": "Too many tries. Please wait 1 minute, then try again.",
  "server-unreachable":
    "Cannot reach the server. Check that the backend is running.",
}

function Icon({ name, className = "" }: { name: string className?: string }) {
  const paths: Record<string, ReactNode> = {
    leaf: (
      <>
        <path d="M19 4C9 3 3 9 6 15s13 3 13-11Z" />
        <path d="M5 20 15 9M9 16v-5m0 5h5" />
      </>
    ),
    sprout: (
      <>
        <path d="M12 21v-9M12 15C4 15 3 9 3 6c6 0 9 3 9 9ZM12 12c0-7 5-9 9-9 0 6-3 9-9 9ZM6 21h12" />
      </>
    ),
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
    hide: (
      <>
        <path d="m3 3 18 18M10 5c7-1 12 7 12 7a21 21 0 0 1-4 5M6 6a22 22 0 0 0-4 6s4 7 10 7a12 12 0 0 0 4-1" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
    drop: (
      <path d="M12 3C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-12ZM8 15a4 4 0 0 0 4 4" />
    ),
    status: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    readings: (
      <>
        <path d="M8 3v11a4 4 0 1 0 5 0V3a2.5 2.5 0 0 0-5 0ZM17 5h4m-4 5h3M10.5 9v8" />
      </>
    ),
  }
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
      {paths[name] || paths.leaf}
    </svg>
  )
}

export default function App({ state = "empty", onSubmit }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const blocked = state === "submitting" || state === "too-many-tries"
  const error = messages[state]
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!blocked) onSubmit?.(email, password)
  }

  return (
    <main className="login-page">
      <section className="photo-panel" aria-label="Welcome to Sibol">
        <div className="photo-image" />
        <div className="photo-shade" />
        <div className="mobile-brand">
          <span
            className="logo-tile"
            role="img"
            aria-label="Sibol seedling logo"
          />
          <span>Sibol</span>
        </div>
        <div className="photo-content">
          <span className="leaf-badge">
            <Icon name="leaf" />
          </span>
          <p className="photo-eyebrow">A LITTLE CARE. A LITTLE GROWTH.</p>
          <h1 className="photo-heading">
            Welcome back
            <br /> to Sibol.
          </h1>
          <span className="photo-rule" />
          <p className="photo-description">
            Enter your readings, see how each bed is doing, and give your plants
            the right amount of water.
          </p>
        </div>
        <div className="feature-strip">
          {[
            ["readings", "3 readings", "Soil, temperature, humidity"],
            ["status", "Clear status", "Too Dry, Optimal or Too Wet"],
            ["drop", "Liters to apply", "The right amount for each bed"],
          ].map(([icon, title, description]) => (
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
            <span
              className="logo-tile"
              role="img"
              aria-label="Sibol seedling logo"
            />
            <span className="wordmark">Sibol</span>
            <p className="brand-description">
              Watering guide for rooftop and indoor farms
            </p>
            <span className="brand-rule" />
          </header>
          <form
            className="login-form"
            onSubmit={submit}
            aria-busy={state === "submitting"}
          >
            <div className="form-heading">
              <h2>Welcome back</h2>
              <p>Log in to check your beds.</p>
            </div>
            {error && (
              <div className="error-banner" role="alert">
                <Icon name="info" />
                <span>{error}</span>
              </div>
            )}
            <div className="field-group">
              <label htmlFor="sibol-email">Email address</label>
              <div
                className={`input-wrap ${
                  state === "wrong-details" ? "invalid" : ""
                } ${state === "focused" ? "is-focused" : ""}`}
              >
                <Icon name="mail" />
                <input
                  id="sibol-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoFocus={state === "focused"}
                  aria-invalid={state === "wrong-details"}
                  required
                />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="sibol-password">Password</label>
              <div
                className={`input-wrap ${
                  state === "wrong-details" ? "invalid" : ""
                }`}
              >
                <Icon name="lock" />
                <input
                  id="sibol-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={state === "wrong-details"}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? "hide" : "eye"} />
                </button>
              </div>
            </div>
            <button
              className={`submit-button ${
                state === "too-many-tries" ? "rate-limited" : ""
              }`}
              type="submit"
              disabled={blocked}
            >
              <span>
                {state === "submitting"
                  ? "Logging in…"
                  : state === "too-many-tries"
                    ? "Try again in 0:45"
                    : "Log in"}
              </span>
              {state === "submitting" ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                state !== "too-many-tries" && <Icon name="arrow" />
              )}
            </button>
            <p className="account-note">
              <Icon name="info" />
              <span>
                Need an account or a password reset?
                <br /> Ask your Super Admin.
              </span>
            </p>
          </form>
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
          <footer className="footer">© 2026 Sibol</footer>
        </div>
      </section>
    </main>
  )
}
