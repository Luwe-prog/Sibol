import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Droplet,
  Eye,
  EyeOff,
  Info,
  Leaf,
  Lock,
  Mail,
  SibolMark,
  Spinner,
  Thermometer,
  UserX,
  WifiOff,
} from '../components/icons.jsx'
import { useAuth } from '../context/useAuth.js'

// The photo on the left side, served from frontend/public/login-hero.jpg.
// If the file is missing, the panel shows a plain green background instead.
// The full-size original is kept in frontend/design/.
const HERO_IMAGE = '/login-hero.jpg'

const YEAR = new Date().getFullYear()

const field =
  'block h-14 w-full rounded-xl border bg-white pl-12 text-base text-stone-900 placeholder-stone-400 ' +
  'focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700'

// What to show for each way a login can fail.
const ERRORS = {
  wrong: {
    Icon: AlertCircle,
    title: 'The email or password is incorrect.',
    detail: 'Check for typing mistakes and try again.',
  },
  deactivated: {
    Icon: UserX,
    title: 'This account has been deactivated.',
    detail: 'Ask your Super Admin to turn it back on.',
  },
  throttled: {
    Icon: Clock,
    title: 'Too many tries.',
    detail: 'Please wait 1 minute, then try again.',
  },
  unreachable: {
    Icon: WifiOff,
    title: 'Cannot reach the server.',
    detail: 'Check that the backend is running.',
  },
  other: {
    Icon: AlertCircle,
    title: 'Something went wrong.',
    detail: 'Please try again.',
  },
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
  const [heroMissing, setHeroMissing] = useState(false)

  const error = errorKey ? ERRORS[errorKey] : null
  const invalid = errorKey === 'wrong'

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

  const fieldBorder = invalid ? 'border-red-700' : 'border-stone-300'

  const buttonTone =
    waitSeconds > 0
      ? 'cursor-not-allowed bg-stone-200 text-stone-700'
      : submitting
        ? 'cursor-progress bg-green-900 text-white'
        : 'bg-green-800 text-white shadow-sm hover:bg-green-900'

  return (
    <div className="min-h-screen bg-[#f7f6f1] text-stone-900 lg:grid lg:grid-cols-2">
      {/* Left: photo panel. Shown on laptops and wider. */}
      <aside
        aria-label="About Sibol"
        className="relative hidden overflow-hidden bg-gradient-to-br from-green-100 via-green-200 to-green-400 lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-[72px]"
      >
        {!heroMissing && (
          <img
            src={HERO_IMAGE}
            alt=""
            onError={() => setHeroMissing(true)}
            // The photo is wider than the panel. This keeps the planter bed on the right in view.
            className="absolute inset-0 h-full w-full object-cover object-[76%_50%]"
          />
        )}
        {/* Soft washes so the dark heading at the top and the white line at the bottom stay readable. */}
        <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white/85 via-white/55 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-green-950/60 to-transparent" aria-hidden="true" />

        <div className="relative">
          <div className="flex items-center gap-4">
            <SibolMark className="h-12 w-12" />
            <span className="text-4xl font-bold tracking-tight text-green-900">Sibol</span>
            <span className="h-9 w-px bg-stone-400/70" aria-hidden="true" />
            <span className="text-sm text-stone-600">Watering guide for rooftop and indoor farms</span>
          </div>

          <p className="mt-16 max-w-xl text-5xl font-bold leading-tight tracking-tight text-green-950">
            Welcome back to Sibol.
          </p>
          <p className="mt-5 max-w-md text-xl leading-8 text-stone-600">
            Enter your readings, see how each bed is doing, and give your plants the right amount of water.
          </p>

          {/* A sample of what the app shows for one bed. */}
          <div className="mt-12 w-full max-w-[420px] rounded-2xl border border-white/60 bg-white/85 p-6 shadow-xl shadow-green-950/10 backdrop-blur-md">
            <div className="flex items-center gap-2.5 border-b border-stone-200 pb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-stone-900">
                <Leaf aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
              <span className="text-base font-medium text-stone-900">Bed 02</span>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Optimal</span>
            </div>
            <dl className="mt-4 grid grid-cols-3 divide-x divide-stone-200">
              <div className="pr-4">
                <Droplet aria-hidden="true" className="h-6 w-6 rounded-full bg-stone-100 p-1 text-stone-900" />
                <dt className="mt-2 text-xs text-stone-500">Soil Moisture</dt>
                <dd className="mt-0.5 text-lg font-semibold text-stone-900">78%</dd>
                <div className="mt-2 h-1.5 rounded-full bg-stone-200" aria-hidden="true">
                  <div className="h-1.5 w-[78%] rounded-full bg-green-700" />
                </div>
              </div>
              <div className="px-4">
                <Thermometer aria-hidden="true" className="h-6 w-6 rounded-full bg-stone-100 p-1 text-stone-900" />
                <dt className="mt-2 text-xs text-stone-500">Temperature</dt>
                <dd className="mt-0.5 text-lg font-semibold text-stone-900">29°C</dd>
              </div>
              <div className="pl-4">
                <Droplet aria-hidden="true" className="h-6 w-6 rounded-full bg-stone-100 p-1 text-stone-900" />
                <dt className="mt-2 text-xs text-stone-500">Humidity</dt>
                <dd className="mt-0.5 text-lg font-semibold text-stone-900">64%</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
            <Leaf aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <span className="h-5 w-px bg-white/60" aria-hidden="true" />
          <span className="text-sm font-medium">The right amount of water for healthier plants.</span>
        </div>
      </aside>

      {/* Right: the form. */}
      <main className="relative flex min-h-screen flex-col overflow-hidden px-5 pb-6 pt-6 sm:px-10 lg:px-16 lg:pt-10">
        {/* Faint leaves in the bottom corner. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 400"
          className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 text-green-700/10 lg:h-[420px] lg:w-[420px]"
        >
          <path fill="currentColor" d="M20 400C20 250 110 150 270 140C270 290 180 390 20 400Z" />
          <path fill="currentColor" d="M300 300C290 180 330 90 400 40V300Z" />
        </svg>

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:invisible">
            <SibolMark className="h-11 w-11" />
            <div>
              <p className="text-2xl font-bold leading-7 tracking-tight text-green-900">Sibol</p>
              <p className="mt-0.5 text-sm text-stone-600">Watering guide for rooftop &amp; indoor farms</p>
            </div>
          </div>
          <p className="hidden text-right text-sm text-stone-600 sm:block">
            Don’t have an account? <span className="font-semibold text-green-800">Ask your Super Admin</span>
          </p>
        </div>

        <div className="relative mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-center py-10">
          <h1 className="text-4xl font-bold tracking-tight text-green-950 sm:text-5xl">Sign in</h1>
          <p className="mt-3 text-lg text-stone-600">Access your Sibol dashboard.</p>

          {/* Always in the page, so a screen reader announces the banner when it appears. */}
          <div id="login-alert" role="alert" aria-atomic="true">
            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <error.Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{error.title}</p>
                  <p className="mt-0.5">{error.detail}</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} aria-busy={submitting} className="mt-8 flex flex-col gap-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-base font-medium text-stone-800">
                Email address
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@example.com"
                  readOnly={submitting}
                  aria-invalid={invalid}
                  aria-describedby={error ? 'login-alert' : undefined}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`${field} ${fieldBorder} pr-4`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-base font-medium text-stone-800">
                Password
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                <input
                  id="password"
                  name="password"
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  ref={passwordRef}
                  readOnly={submitting}
                  aria-invalid={invalid}
                  aria-describedby={error ? 'login-alert' : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${field} ${fieldBorder} pr-24`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-controls="password"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-px right-px flex min-w-[44px] items-center gap-1.5 rounded-r-[11px] px-4 text-sm font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700"
                >
                  {show ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || waitSeconds > 0}
              className={`mt-2 flex h-14 w-full items-center justify-center gap-2.5 rounded-xl px-4 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${buttonTone}`}
            >
              {submitting ? (
                <>
                  <Spinner aria-hidden="true" className="h-5 w-5 animate-spin" />
                  Logging in…
                </>
              ) : waitSeconds > 0 ? (
                <>
                  <Clock aria-hidden="true" className="h-5 w-5" />
                  Try again in {mmss(waitSeconds)}
                </>
              ) : (
                <>
                  Log in
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </>
              )}
            </button>
            <span className="sr-only" aria-live="polite">
              {submitting ? 'Logging in…' : ''}
            </span>
          </form>

          <div className="mt-6 flex items-start gap-2.5 text-sm leading-5 text-stone-600">
            <Info aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>
              No account, or forgot your password?{' '}
              <span className="font-semibold text-green-800">Ask your Super Admin.</span>
            </p>
          </div>
        </div>

        <p className="relative text-right text-xs text-stone-500">© {YEAR} Sibol</p>
      </main>
    </div>
  )
}
