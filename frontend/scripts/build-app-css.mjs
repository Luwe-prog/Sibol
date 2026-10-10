// Turns the stylesheet exported from Figma Make (kept in design/figma-app) into src/components/app.css,
// the styles of the signed-in screens. Everything is under the .sibol-app class.
// Run again after a new export:  node scripts/build-app-css.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const source = new URL('../design/figma-app/src/index.css', import.meta.url)
const target = new URL('../src/components/app.css', import.meta.url)

const swap = (text, from, to) => {
  if (!text.includes(from)) throw new Error(`Not found in the export: ${from}`)
  return text.replace(from, to)
}

let css = readFileSync(source, 'utf8').replace(/^@import.*$/gm, '')

// The font is bundled with the app.
css = swap(css, "font-family: 'DM Sans', sans-serif;", "font-family: 'DM Sans Variable', system-ui, sans-serif;")
// These two would undo Tailwind's sizes and weights on every input and button inside the app.
css = swap(css, '.sibol-app :is(button,input,select,textarea) { font: inherit; }\n', '')
css = swap(css, '.sibol-app button:disabled { cursor: default; opacity: .5; }', '.sibol-app .btn:disabled { cursor: not-allowed; opacity: .5; }')
// Heading sizes as low-priority defaults, so a class on the heading can still change them.
css = swap(css, '.sibol-app h2 {', '.sibol-app :where(h2) {')
css = swap(css, '.sibol-app h3 {', '.sibol-app :where(h3) {')

const extras = `
/* ---- Added for the app (not part of the export) ---- */

/* The real logo, and links that look like the export's buttons. */
.sibol-app .brand { text-decoration: none; color: inherit; }
.sibol-app .brand img { width: 38px; height: 38px; border-radius: 10px; }
.sibol-app .mobile-header .brand img { width: 32px; height: 32px; border-radius: 8px; }
.sibol-app :is(a.nav-item, a.sidebar-action, a.btn) { text-decoration: none; }
.sibol-app .nav-item .sr-only, .sibol-app .mobile-tabs .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.sibol-app .mobile-tabs :is(a, button) { display: flex; flex-direction: column; align-items: center; gap: 5px; background: transparent; border: 0; padding: 6px 0; min-height: 48px; font-size: 12px; color: var(--muted); text-decoration: none; position: relative; }
.sibol-app .mobile-tabs .active { color: var(--green); font-weight: 600; background: #f0f5eb; border-radius: 8px; }
.sibol-app .tab-count { position: absolute; top: 0; left: calc(50% + 6px); min-width: 18px; padding: 0 5px; border-radius: 9px; background: var(--green); color: #fff; font-size: 11px; font-weight: 600; line-height: 18px; }
.sibol-app .btn-danger:hover { background: #fdf1f0; }
.sibol-app .btn-danger-solid { background: #a62f2f; color: #fff; }
.sibol-app .btn-danger-solid:hover { background: #8c2525; }
.sibol-app .btn-secondary { color: var(--green); }
.sibol-app .btn-block { width: 100%; }

/* More statuses than the export's sample data had. */
.sibol-app .zone-wet .zone-status { background: #eef4fa; border-color: #d6e3ef; }
.sibol-app .zone-none .zone-status { background: #f3f4f0; border-color: #e3e5df; }
.sibol-app .badge { white-space: nowrap; }
.sibol-app .badge-role { background: var(--green); color: #fff; }
.sibol-app .stat-0 { background: #fdf9ee; border-color: #efe5cd; }
.sibol-app .stat-2 { background: #f1f6fa; border-color: #d9e5ee; }
.sibol-app .tone-warn { background: #fff0e1; color: #95541d; }

/* Zone cards: several per farm, links in the title, and room for extra buttons. */
.sibol-app .farm-zone-group { min-width: 0; }
.sibol-app .zone-card { display: flex; flex-direction: column; }
.sibol-app .zone-card + .zone-card { margin-top: 16px; }
.sibol-app .zone-identity h3 a { color: inherit; text-decoration: none; }
.sibol-app .zone-identity h3 a:hover { text-decoration: underline; }
.sibol-app .zone-identity p { flex-wrap: wrap; }
.sibol-app .zone-footnote { flex-direction: column; align-items: flex-start; justify-content: center; gap: 8px; }
.sibol-app .zone-footnote .zone-next { color: var(--green); font-weight: 500; }
.sibol-app .zone-actions { flex-wrap: wrap; margin-top: auto; }
.sibol-app .zone-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
.sibol-app .farm-table-heading td { display: flex; align-items: center; }
.sibol-app .zone-grid .zone-card + .zone-card { margin-top: 0; }
.sibol-app .attention-row + .attention-row { border-top: 1px solid var(--border); }
.sibol-app .attention-zone strong a { color: inherit; text-decoration: none; }
.sibol-app .attention-zone strong a:hover { text-decoration: underline; }
.sibol-app .attention-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.sibol-app .farm-group-heading h3 a { color: inherit; text-decoration: none; }
.sibol-app .farm-group-heading h3 a:hover { text-decoration: underline; }

/* Farms and accounts that have been made inactive. */
.sibol-app .farm-card.is-inactive .farm-card-banner { background: #eceee9; color: #62695f; }
.sibol-app .farm-card-banner .banner-tags { display: flex; gap: 6px; }
.sibol-app .farm-card-banner .banner-tags span { font-size: 12px; padding: 4px 10px; border: 1px solid #b3c6a8; border-radius: 20px; background: #ffffff66; }
.sibol-app .farm-card-body p + p { margin-top: 8px; }
.sibol-app .account-card.is-inactive .account-avatar { background: #eceee9; color: #62695f; }

/* Reading form: errors under a field. */
.sibol-app .field-error { color: #b42318; font-size: 12px; font-weight: 500; }
.sibol-app .field-control :is(input, select)[aria-invalid='true'] { border-color: #b42318; }
.sibol-app .reading-meta { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 18px; }
.sibol-app .unusual-box ul { margin: 10px 0; padding-left: 20px; list-style: disc; }
.sibol-app .unusual-box .form-actions { margin-top: 14px; }

/* Activity log: one line per changed value. */
.sibol-app .change-list { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-top: 14px; }
.sibol-app .change-list .change-values { margin-top: 0; flex-wrap: wrap; }

/* Temporary password window. */
.sibol-app .password-display { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sibol-app .password-display code { font: inherit; user-select: all; }

/* The crop table is wide; let it scroll inside its card on mid-size screens. */
.sibol-app .table-scroll { overflow-x: auto; }
.sibol-app .report-table td:not(:first-child), .sibol-app .report-table th:not(:first-child) { text-align: right; white-space: nowrap; }

@media (max-width: 700px) {
  .sibol-app .reading-meta { grid-template-columns: 1fr; gap: 2px; }
  .sibol-app .zone-grid { grid-template-columns: 1fr; }
  .sibol-app .data-table .farm-table-heading td { display: flex; }
  .sibol-app .report-table td:not(:first-child) { text-align: left; }
  .sibol-app .mobile-header .avatar { border: 0; }
}
`

const header = `/* Styles of the signed-in screens. Generated by scripts/build-app-css.mjs from the Figma Make
   export in design/figma-app. Every rule is under .sibol-app. */
`

writeFileSync(target, header + css.trim() + '\n' + extras)
console.log('app.css written')
