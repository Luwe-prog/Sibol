import '@fontsource-variable/dm-sans'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SibolMark } from '../components/icons.jsx'
import './landing.css'

// The public page shown at "/" to visitors who are not logged in.
// Layout and wording come from the Figma Make design; its styles live in landing.css,
// all under the .landing class, so they do not affect the rest of the app.
//
// Everything said here must be true of the system: no sensors, no live data,
// no made-up numbers or quotes.

// Photos are stored in public/landing so the page works without internet.
const GARDEN = '/landing/garden.jpg'
const LEAVES = '/landing/leaves.jpg'

const NAV = [
  ['How it works', 'how-it-works'],
  ['Features', 'features'],
  ['Crops', 'crops'],
  ['FAQ', 'faq'],
]

const ICON_PATHS = {
  sprout: <path d="M12 21v-9M12 15C5 15 3 11 3 5c6 0 9 3 9 8M12 11c0-5 3-8 9-8 0 6-3 9-9 9" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  drop: (
    <>
      <path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z" />
      <path d="M8 15a4 4 0 0 0 4 4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chart: <path d="M4 3v17h17M7 15l4-5 4 3 5-7" />,
  report: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7m-7 4h7" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
}

function Icon({ kind = 'sprout', className = '' }) {
  return (
    <svg
      className={className}
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
      {ICON_PATHS[kind]}
    </svg>
  )
}

function Logo() {
  return (
    <a href="#top" className="logo" aria-label="Sibol, back to top">
      <SibolMark aria-hidden="true" />
      <span>
        Sibol<span className="logo-period">.</span>
      </span>
    </a>
  )
}

function LoginLink({ light = false }) {
  return (
    <Link to="/login" className={light ? 'button button-sage' : 'button button-green'}>
      Log in <Icon kind="arrow" />
    </Link>
  )
}

function Tag({ children }) {
  return <span className="tag">{children}</span>
}

const FEATURES = [
  ['check', 'Clear status for every bed', 'Too Dry, Optimal or Too Wet at a glance.'],
  ['drop', 'Liters, not guesses', 'The exact amount to apply, worked out from the crop’s ideal range and the size of the bed.'],
  ['sun', 'Rooftop or indoor advice', 'Shade and watering time on rooftops, ventilation indoors.'],
  ['clock', 'Next watering estimate', 'When a bed will likely need water again, based on how fast it has been drying.'],
  ['chart', 'Trends and history', 'Charts of every reading with the ideal range shaded.'],
  ['report', 'Water report', 'Recommended vs. applied water, with CSV export and print.'],
]

const STEPS = [
  ['Measure', 'Check soil moisture, temperature and humidity at the bed.'],
  ['Enter', 'Type the three numbers into Sibol on a phone or laptop.'],
  ['Get the answer', 'Too Dry / Optimal / Too Wet, advice, and the liters to apply.'],
  ['Track', 'Record the water you actually used and watch the trends.'],
]

// The six seed crops. A crop without a photo shows a plain tile, which is better than a wrong plant.
const CROPS = [
  ['Pechay', '/landing/pechay.jpg', 'Pechay leaves in a bowl'],
  ['Lettuce', '/landing/leaves.jpg', 'Lettuce growing in a raised bed'],
  // This photo is not from Unsplash: it is by Panlasang Pinoy, so it carries a credit line.
  ['Kangkong', '/landing/kangkong.jpg', 'A bunch of fresh kangkong', 'Photo: Panlasang Pinoy'],
  ['Tomato', '/landing/tomato.jpg', 'Ripe tomatoes on the vine'],
  ['Siling labuyo', '/landing/siling.jpg', 'Red and green chili peppers on the plant'],
  ['Basil', '/landing/basil.jpg', 'Dark green basil leaves'],
]

const FAQS = [
  ['Do I need sensors?', 'No. Readings are typed in by hand.'],
  [
    'How are the liters worked out?',
    'From the middle of the crop’s ideal soil moisture range, the current reading, and how many liters raise that bed’s moisture by one point.',
  ],
  ['How do I get an account?', 'Accounts are created by your Super Admin. There is no public sign-up.'],
  ['Does it work on a phone?', 'Yes. The reading form is built for phones.'],
]

const YEAR = new Date().getFullYear()

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0)

  const rootRef = useRef(null)
  // The id of the section crossing the middle of the screen, for the highlighted nav link.
  const [active, setActive] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.title = 'Sibol — Water every bed the right amount'
    return () => {
      document.title = 'Sibol'
    }
  }, [])

  // Everything tied to the scroll position: the sticky bar's shadow, the reading-progress line,
  // the hero's slow drift, and the blocks that pop in and out.
  useEffect(() => {
    const root = rootRef.current
    // On devices that ask for reduced motion (on Windows: "Animation effects" off) the blocks
    // still pop in and out, but only by fading and growing slightly: no tilt, no travel, no drift.
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const blocks = [...root.querySelectorAll('.reveal')]
    let frame = 0

    // Switched on from here, so the page is fully visible if this script never runs.
    root.classList.add('landing--animate')
    if (calm) root.classList.add('landing--calm')

    // How visible each block is, from 0 to 1, worked out from where it sits on screen:
    // it grows in over the bottom third of the screen and shrinks away as it slides under the top bar.
    const scrub = () => {
      const screen = window.innerHeight
      const bar = root.querySelector('.nav-bar')?.offsetHeight ?? 80

      blocks.forEach((block) => {
        // Position from layout, not from getBoundingClientRect: that would include the
        // block's own animation offset and make it chase itself.
        let top = -window.scrollY
        for (let node = block; node; node = node.offsetParent) top += node.offsetTop
        const bottom = top + block.offsetHeight

        // Items in a row carry a --delay, so they arrive one after another.
        const stagger = (parseFloat(block.style.getPropertyValue('--delay')) || 0) * 0.6
        const entering = (screen - top - stagger) / (screen * 0.34)
        const leaving = (bottom - bar) / (screen * 0.22)
        const raw = Math.max(0, Math.min(1, entering, leaving))
        const eased = raw * raw * (3 - 2 * raw)

        block.style.setProperty('--v', eased.toFixed(3))
        // 1 while coming up from the bottom, -1 while leaving at the top: the tilt mirrors.
        block.style.setProperty('--dir', leaving < entering ? '-1' : '1')
      })
    }

    const update = () => {
      frame = 0
      const y = window.scrollY
      const range = document.documentElement.scrollHeight - window.innerHeight
      setScrolled(y > 8)
      root.style.setProperty('--progress', range > 0 ? String(Math.min(1, y / range)) : '0')
      if (!calm) root.style.setProperty('--hero-y', `${Math.min(y, 800) * 0.12}px`)
      scrub()
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    // Opening an FAQ answer or a late-loading photo moves things without a scroll.
    const layout = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onScroll)
    layout?.observe(root)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      layout?.disconnect()
      cancelAnimationFrame(frame)
      root.classList.remove('landing--animate', 'landing--calm')
    }
  }, [])

  // Which section is on screen, for the highlighted link in the top bar.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined

    // A section counts as "current" while it crosses a thin band just above the middle of the screen.
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id
          setActive((current) => (entry.isIntersecting ? id : current === id ? null : current))
        })
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    NAV.forEach(([, id]) => {
      const section = document.getElementById(id)
      if (section) spy.observe(section)
    })

    return () => spy.disconnect()
  }, [])

  const sectionLinks = NAV.map(([label, id]) => (
    <a key={id} href={`#${id}`} className={active === id ? 'is-active' : undefined} aria-current={active === id ? 'location' : undefined}>
      {label}
    </a>
  ))

  return (
    <div className="landing" id="top" ref={rootRef}>
      {/* Stays at the top while scrolling. The link of the section on screen is highlighted,
          and the thin bar underneath fills as the page is read. */}
      <div className={scrolled ? 'nav-bar is-scrolled' : 'nav-bar'}>
        <header className="header wrap">
          <Logo />
          <nav aria-label="Main navigation">{sectionLinks}</nav>
          <LoginLink />
        </header>
        {/* Phones have no room for the links beside the logo, so they get their own row. */}
        <nav className="section-tabs" aria-label="Sections">
          {sectionLinks}
        </nav>
        <div className="nav-progress" aria-hidden="true" />
      </div>

      <main>
        <section className="hero page-inset" aria-labelledby="hero-title">
          <img className="hero-image" src={GARDEN} alt="Leafy vegetables growing in neatly arranged raised garden beds" fetchPriority="high" />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="hero-eyebrow">
              <span /> SMALL FARMS. THOUGHTFUL WATERING.
            </span>
            <h1 id="hero-title">
              {/* The space matters: on phones the line break is hidden and the words must not join. */}
              Water every bed{' '}
              <br />
              the right amount.
            </h1>
            <div className="hero-bottom">
              <div>
                <p>
                  Enter three simple readings and Sibol tells you if a bed is too dry, just right, or too wet, and exactly how
                  many liters to give.
                </p>
                <div className="hero-actions">
                  <LoginLink light />
                  <a href="#how-it-works" className="button button-outline">
                    See how it works <Icon kind="arrow" />
                  </a>
                </div>
              </div>
              <span className="hero-note">
                <Icon /> A little guidance.
                <br />A healthier garden.
              </span>
            </div>
          </div>
          <div className="hero-caption">ROOTED IN CARE. GROWN WITH PURPOSE.</div>
        </section>

        <section className="intro wrap section-space">
          <Tag>Made for rooftop &amp; indoor farms</Tag>
          <div className="intro-grid">
            <h2 className="reveal reveal-left">
              Less guessing,
              <br />
              healthier plants.
            </h2>
            <div className="reveal reveal-right">
              <p className="intro-text">Small farms often water by habit. Sometimes it’s too much. Sometimes, not enough.</p>
              <p>
                Sibol turns a quick check of the soil and air into a clear instruction, without buying sensors. Built for the
                people growing a little greener in the Philippines.
              </p>
              <span className="text-note">
                <Icon /> Measured by you. Made clear by Sibol.
              </span>
            </div>
          </div>

          <div className="facts-grid">
            <article className="fact fact-photo reveal" style={{ '--delay': '0ms' }}>
              <img src={LEAVES} alt="Fresh green lettuce in a raised garden bed" loading="lazy" />
              <div>
                <h3>
                  3 <span>readings</span>
                </h3>
                <p>
                  Soil moisture, temperature,
                  <br />
                  humidity
                </p>
              </div>
            </article>
            <article className="fact fact-cream reveal" style={{ '--delay': '90ms' }}>
              <Icon />
              <div>
                <h3>
                  6 <span>crops built in</span>
                </h3>
                <p>
                  Pechay, lettuce, kangkong,
                  <br />
                  tomato, siling labuyo, basil
                </p>
              </div>
            </article>
            <article className="fact fact-photo reveal" style={{ '--delay': '180ms' }}>
              <img src={GARDEN} alt="Rows of vegetables growing in small raised beds" loading="lazy" />
              <div>
                <h3>
                  2 <span>environments</span>
                </h3>
                <p>
                  Rooftop and indoor.
                  <br />
                  Different spaces, different advice.
                </p>
              </div>
            </article>
            <article className="fact fact-sage reveal" style={{ '--delay': '270ms' }}>
              <Icon kind="drop" />
              <div>
                <h3>
                  0 <span>sensors needed</span>
                </h3>
                <p>
                  Works with a simple soil meter
                  <br />
                  and thermometer.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="how wrap section-space" id="how-it-works">
          <div className="section-heading reveal">
            <div>
              <Tag>A simple routine</Tag>
              <h2>
                Good watering starts
                <br />
                with a quick check.
              </h2>
            </div>
            <p>
              Four small steps. One clear answer.
              <br />
              From your first reading to your next watering.
            </p>
          </div>
          <div className="how-grid">
            <div className="steps">
              {STEPS.map(([title, text], index) => (
                <article className="step reveal" style={{ '--delay': `${index * 90}ms` }} key={title}>
                  <span className="step-number">0{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <Icon kind="arrow" />
                </article>
              ))}
            </div>
            <div className="example-scene reveal reveal-right">
              <img src={LEAVES} alt="Healthy lettuce leaves in a vegetable garden" loading="lazy" />
              {/* Fixed sample values, labelled as an example. Not data from the system. */}
              <article className="example-card">
                <div className="example-top">
                  <span className="example-label">EXAMPLE</span>
                  <span className="small">Rooftop farm</span>
                </div>
                <div className="bed-title">
                  <span className="bed-icon">
                    <Icon />
                  </span>
                  <div>
                    <h3>Bed 2</h3>
                    <p>Pechay</p>
                  </div>
                  <span className="status-dry">Too Dry</span>
                </div>
                <div className="water-result">
                  <span>RECOMMENDED WATER</span>
                  <p>
                    <span className="apply">Apply about</span> 12.5 <span>L</span>
                  </p>
                </div>
                <div className="advice">
                  <Icon kind="sun" />
                  <p>Water early in the morning or late in the afternoon, and add shade netting.</p>
                </div>
                <div className="example-foot">
                  <Icon kind="check" /> A clear next step for your bed.
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="features page-inset" id="features">
          <div className="features-inner">
            <div className="section-heading reveal">
              <div>
                <Tag>Built around your beds</Tag>
                <h2>
                  Everything a small farm{' '}
                  <br />
                  needs to water well.
                </h2>
              </div>
              <p>
                Practical guidance, from the first drop
                <br />
                to the bigger picture.
              </p>
            </div>
            <div className="features-grid">
              {FEATURES.map(([icon, title, text], index) => (
                <article className="feature-card reveal" style={{ '--delay': `${(index % 3) * 100}ms` }} key={title}>
                  <span className="feature-icon">
                    <Icon kind={icon} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <div className="feature-foot reveal">
              <Icon /> No complicated setup. Just your readings, and a little clarity.
            </div>
          </div>
        </section>

        <section className="crops wrap section-space" id="crops">
          <div className="section-heading reveal">
            <div>
              <Tag>Meet the crop library</Tag>
              <h2>
                Familiar crops.
                <br />
                Care that fits.
              </h2>
            </div>
            <p>
              Six crops built in, each with its own
              <br />
              ideal growing ranges.
            </p>
          </div>
          <div className="crop-grid">
            {CROPS.map(([name, src, alt, credit], index) => (
              <article className="crop-card reveal" style={{ '--delay': `${index * 70}ms` }} key={name}>
                {src ? (
                  <img src={src} alt={alt} loading="lazy" />
                ) : (
                  <div className="crop-placeholder">
                    <Icon />
                  </div>
                )}
                <h3>
                  {name}
                  {credit && <span className="crop-credit">{credit}</span>}
                </h3>
              </article>
            ))}
          </div>
          <p className="crop-note">
            <Icon kind="sprout" /> Ideal ranges can be adjusted by your Super Admin.
          </p>
        </section>

        <section className="roles wrap section-space">
          <div className="section-heading reveal">
            <div>
              <Tag>A place for everyone</Tag>
              <h2>
                One garden.
                <br />A team behind it.
              </h2>
            </div>
            <p>
              Clear roles keep your farms organized
              <br />
              and your beds cared for.
            </p>
          </div>
          <div className="roles-grid">
            <article className="role-card reveal">
              <span className="role-icon">
                <Icon kind="report" />
              </span>
              <div>
                <span className="eyebrow">THE BIG PICTURE</span>
                <h3>Super Admin</h3>
                <p>Sets up farms, creates accounts, manages the crop library, and sees every farm and the activity log.</p>
              </div>
            </article>
            <article className="role-card reveal">
              <span className="role-icon">
                <Icon kind="user" />
              </span>
              <div>
                <span className="eyebrow">THE EVERYDAY CARE</span>
                <h3>Admin</h3>
                <p>Tends the beds, enters readings, and manages zones on the farms they are assigned to.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="faq wrap section-space" id="faq">
          <div className="reveal reveal-left">
            <Tag>A little more clarity</Tag>
            <h2>
              Good questions.
              <br />
              Simple answers.
            </h2>
            <p>
              Getting to know Sibol?
              <br />
              Here’s where to start.
            </p>
          </div>
          <div className="faq-list reveal reveal-right">
            {FAQS.map(([question, answer], index) => (
              <article className={openFaq === index ? 'faq-item is-open' : 'faq-item'} key={question}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={openFaq === index}
                    aria-controls={`answer-${index}`}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    {question}
                    <span aria-hidden="true">{openFaq === index ? '−' : '+'}</span>
                  </button>
                </h3>
                <div id={`answer-${index}`} hidden={openFaq !== index}>
                  <p>{answer}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="closing page-inset reveal">
          <div>
            <Tag>Small steps. Steady growth.</Tag>
            <h2>
              Ready to check
              <br />
              your beds?
            </h2>
            <LoginLink light />
            <p>Need an account? Ask your Super Admin.</p>
          </div>
          <img src={GARDEN} alt="Lettuce and green onions thriving in raised vegetable beds" loading="lazy" />
        </section>
      </main>

      <footer className="footer wrap">
        <div className="footer-top">
          <div>
            <Logo />
            <p>
              Watering guide for rooftop
              <br />
              and indoor farms
            </p>
          </div>
          <nav aria-label="Footer navigation">
            {NAV.map(([label, id]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="footer-project">
            <span>A SCHOOL PROJECT, ROOTED IN PURPOSE</span>
            <p>
              A Field Engagement on Indoor and Rooftop{' '}
              <br />
              Farming System with Optimization
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {YEAR} Sibol. All rights reserved.</span>
          <span>Made for growing, one bed at a time.</span>
        </div>
      </footer>
    </div>
  )
}
