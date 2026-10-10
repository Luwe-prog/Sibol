// Shared class strings from the Sibol design foundations.
// Tailwind only finds classes written out in full, so these stay literal strings.

// Buttons use the design's classes from components/app.css, so they only look right inside .sibol-app.
// One primary button per screen area.
export const btnPrimary = 'btn btn-primary'
export const btnPrimarySmall = 'btn btn-primary'
export const btnSecondary = 'btn btn-secondary'
export const btnSmall = 'btn btn-secondary'
// Outline danger in pages and lists; solid danger only inside a confirmation window.
export const btnDanger = 'btn btn-danger'
export const btnDangerSmall = 'btn btn-danger'
export const btnDangerSolid = 'btn btn-danger-solid'

export const linkClass = 'font-semibold text-forest underline decoration-forest/40 underline-offset-4 hover:decoration-forest'
export const backLinkClass = 'inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-forest hover:text-charcoal'

export const inputClass =
  'block h-12 w-full rounded-lg border border-field bg-white px-3.5 text-base text-stone-900 placeholder:text-stone-500 ' +
  'focus:border-forest ' +
  'disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-600'

export const textareaClass =
  'block min-h-[104px] w-full rounded-lg border border-field bg-white px-3.5 py-3 text-base leading-6 text-stone-900 placeholder:text-stone-500 ' +
  'focus:border-forest'

// A thin border does most of the work; the shadow only lifts the card a hair off the cream page.
export const cardShadow = 'shadow-[0_1px_2px_rgba(39,53,43,0.05)]'
export const cardClass = `rounded-xl border border-line bg-white ${cardShadow}`
