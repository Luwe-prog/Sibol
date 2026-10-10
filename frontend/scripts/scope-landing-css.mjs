// Turns the stylesheet exported from Figma Make into src/pages/landing.css.
//
// The export styles bare elements (p, h1, a, button…), which would restyle the whole app.
// This script puts every rule under ".landing", so those styles apply only on the landing page.
// Run again after a new export:  node scripts/scope-landing-css.mjs "<path to exported src/index.css>"
import { readFileSync, writeFileSync } from 'node:fs'
import postcss from 'postcss'
import nested from 'postcss-nested'

const source = process.argv[2]
if (!source) {
  console.error('Give the path to the exported index.css')
  process.exit(1)
}

let css = readFileSync(source, 'utf8')
  // The font is bundled with the app (@fontsource-variable/dm-sans) and Tailwind is already loaded.
  // (Whole lines: the Google Fonts address has semicolons of its own.)
  .replace(/^@import.*$/gm, '')
  // Page-level rules that cannot live under .landing; the ones still needed are added back below.
  .replace(/html\{[^}]*\}/g, '')
  .replace(/body\{[^}]*\}/g, '')
  // The variables and base font move from :root onto .landing itself.
  .replace(':root{', '&{')
  .replaceAll("'DM Sans',sans-serif", "'DM Sans Variable',system-ui,sans-serif")

const result = await postcss([nested]).process(`.landing{${css}}`, { from: undefined })
const root = result.root

// The export carried a mock login page; the app has its own.
root.walkRules((rule) => {
  if (/\.login-|\.back-link/.test(rule.selector)) rule.remove()
})

// Nothing smaller than 11 px: captions in the export went down to 7 px.
root.walkDecls('font-size', (decl) => {
  const px = /^(\d+(?:\.\d+)?)px$/.exec(decl.value)
  if (px && Number(px[1]) < 11) decl.value = '11px'
})

const lines = []
root.each((node) => lines.push(node.toString()))

const extras = `
/* Added for the app (not part of the export). */
/* clip, not hidden: blocks sliding in from the side must not widen the page, and "hidden" would break the sticky bar. */
.landing{min-height:100vh;overflow-x:clip}
.landing .logo img{width:40px;height:40px;border-radius:10px}
.landing .crop-placeholder{height:195px;display:flex;align-items:center;justify-content:center;background:var(--sage);color:var(--forest)}
.landing .crop-placeholder svg{width:40px;height:40px}
.landing .crop-credit{display:block;margin-top:4px;font-size:11px;font-weight:400;letter-spacing:0;color:var(--muted)}
/* Tall photos: keep the leafy top of the picture in the frame. */
.landing .crop-card img{object-position:center 25%}
@media(max-width:1100px){.landing .crop-placeholder{height:160px}}
@media(max-width:700px){.landing .logo img{width:36px;height:36px}.landing .crop-placeholder{height:235px}}
/* Smooth scrolling to sections, only while the landing page is on screen.
   The padding keeps a section's heading clear of the sticky bar. */
html:has(.landing){scroll-behavior:smooth;scroll-padding-top:104px}
@media(max-width:700px){html:has(.landing){scroll-padding-top:136px}}
@media(prefers-reduced-motion:reduce){html:has(.landing){scroll-behavior:auto}}

/* Sticky top bar. */
.landing .nav-bar{position:sticky;top:0;z-index:50;background:var(--cream);border-bottom:1px solid transparent;transition:border-color .25s,box-shadow .25s}
.landing .nav-bar.is-scrolled{border-bottom-color:var(--border);box-shadow:0 10px 24px -20px rgba(39,53,43,.55)}
.landing .nav-bar .header{transition:height .25s}
.landing .nav-bar.is-scrolled .header{height:72px}
/* The link of the section on screen: forest green with a line drawn under it. */
.landing .header nav a,.landing .section-tabs a{position:relative;transition:color .2s}
.landing .header nav a::after{content:'';position:absolute;left:0;right:0;bottom:8px;height:2px;border-radius:2px;background:var(--forest);transform:scaleX(0);transform-origin:left;transition:transform .3s}
.landing .header nav a:hover{text-decoration:none}
.landing .header nav a:hover::after,.landing .header nav a.is-active::after{transform:scaleX(1)}
.landing .header nav a.is-active{color:var(--forest)}
/* Reading progress: fills left to right as the page is scrolled. */
.landing .nav-progress{height:2px;background:var(--forest);transform-origin:left;transform:scaleX(var(--progress,0))}
/* Phones: the section links sit in their own row under the logo. */
.landing .section-tabs{display:none}
@media(max-width:700px){
.landing .nav-bar .header,.landing .nav-bar.is-scrolled .header{height:64px}
.landing .section-tabs{display:flex;gap:6px;overflow-x:auto;padding:0 16px 8px;scrollbar-width:none}
.landing .section-tabs::-webkit-scrollbar{display:none}
.landing .section-tabs a{flex-shrink:0;display:flex;align-items:center;min-height:44px;padding:0 14px;border-radius:999px;font-size:13px;border:1px solid transparent;white-space:nowrap}
.landing .section-tabs a.is-active{background:var(--sage);color:var(--forest);border-color:#c5d6c0;font-weight:600}
}

/* Scroll-linked pop in / pop out.
   The page sets --v on each .reveal block: 0 = out of view, 1 = fully in place. Blocks grow in as
   they come up from the bottom and shrink away as they leave at the top, in both scroll directions.
   --dir is 1 while entering and -1 while leaving, which mirrors the tilt.
   The page adds .landing--animate itself, so without its script nothing is ever left hidden. */
.landing--animate{--travel:70px;--tilt:26deg;--shrink:.14;--slide:80px;--swing:26deg}
/* Reduced motion: the same pop, by fade and a slight grow only. No tilt, travel or drift. */
.landing--calm{--travel:0px;--tilt:0deg;--shrink:.07;--slide:0px;--swing:0deg}
.landing--animate .reveal{opacity:var(--v,0);transform:perspective(1000px) translate3d(0,calc((1 - var(--v,0)) * var(--travel) * var(--dir,1)),0) rotateX(calc((1 - var(--v,0)) * var(--tilt) * var(--dir,1))) scale(calc(1 - var(--shrink) + var(--v,0) * var(--shrink)));transform-origin:50% 50%;will-change:transform,opacity}
.landing--animate .reveal-left{transform:perspective(1000px) translate3d(calc((1 - var(--v,0)) * var(--slide) * -1),0,0) rotateY(calc((1 - var(--v,0)) * var(--swing))) scale(calc(1 - var(--shrink) + var(--v,0) * var(--shrink)));transform-origin:0 50%}
.landing--animate .reveal-right{transform:perspective(1000px) translate3d(calc((1 - var(--v,0)) * var(--slide)),0,0) rotateY(calc((1 - var(--v,0)) * var(--swing) * -1)) scale(calc(1 - var(--shrink) + var(--v,0) * var(--shrink)));transform-origin:100% 50%}
/* The hero photo drifts a little slower than the page, for depth. Not in reduced motion. */
.landing--animate:not(.landing--calm) .hero-image{transform:translate3d(0,var(--hero-y,0px),0) scale(1.12);will-change:transform}
`

const header = `/* Landing page styles. Generated by scripts/scope-landing-css.mjs from the Figma Make export.
   Every rule is under .landing so nothing here touches the rest of the app. */
`

writeFileSync(new URL('../src/pages/landing.css', import.meta.url), header + lines.join('\n') + '\n' + extras)
console.log(`landing.css written: ${lines.length} top-level rules`)
