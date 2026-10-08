// Shared class strings from the Sibol design foundations.
// Tailwind only finds classes written out in full, so these stay literal strings.

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ' +
  'disabled:cursor-not-allowed'

const sizeDefault = 'h-12 px-5 text-base'
const sizeSmall = 'h-11 px-3.5 text-sm'

const primary = 'bg-green-800 text-white hover:bg-green-900 active:bg-green-950 disabled:bg-stone-200 disabled:text-stone-600'
const secondary =
  'border border-stone-300 bg-white text-green-900 hover:border-stone-400 hover:bg-stone-50 disabled:text-stone-500 disabled:hover:border-stone-300 disabled:hover:bg-white'
const dangerOutline = 'border border-red-300 bg-white text-red-700 hover:bg-red-50'

// One primary button per screen area.
export const btnPrimary = `${btnBase} ${sizeDefault} ${primary}`
export const btnPrimarySmall = `${btnBase} ${sizeSmall} ${primary}`
export const btnSecondary = `${btnBase} ${sizeDefault} ${secondary}`
// Small buttons are 44 px tall, never smaller.
export const btnSmall = `${btnBase} ${sizeSmall} ${secondary}`
// Outline danger in pages and lists; solid danger only inside a confirmation window.
export const btnDanger = `${btnBase} ${sizeDefault} ${dangerOutline}`
export const btnDangerSmall = `${btnBase} ${sizeSmall} ${dangerOutline}`
export const btnDangerSolid = `${btnBase} ${sizeDefault} bg-red-700 text-white hover:bg-red-800`

export const linkClass = 'font-semibold text-green-800 underline underline-offset-4 hover:text-green-950'
export const backLinkClass = 'inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-green-800 hover:text-green-950'

export const inputClass =
  'block h-12 w-full rounded-xl border border-stone-500 bg-white px-3.5 text-base text-stone-900 placeholder:text-stone-500 ' +
  'focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700 ' +
  'disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-600'

export const textareaClass =
  'block min-h-[104px] w-full rounded-xl border border-stone-500 bg-white px-3.5 py-3 text-base leading-6 text-stone-900 placeholder:text-stone-500 ' +
  'focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700'

export const cardShadow = 'shadow-[0_1px_3px_rgba(20,83,45,0.06),0_8px_24px_-12px_rgba(20,83,45,0.14)]'
export const cardClass = `rounded-2xl border border-stone-200 bg-white ${cardShadow}`
