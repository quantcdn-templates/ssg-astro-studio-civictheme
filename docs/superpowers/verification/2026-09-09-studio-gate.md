# Studio gate — `ssg-astro-studio-civictheme` (2026-09-09)

**Status: PARTIAL.** The template renders, styles, hot-recompiles and builds inside
Quant Studio, but only after two scratch-only workarounds. Two runtime defects and
two runtime limitations block an unmodified checkout. None of them are fixed here:
all four are quant-runtime / portal follow-ups.

## How it was run

No GitHub repository was used. Studio demo mode (`/studio/demo/main/...`,
`HasStudioClient::demoClient()` → `LocalStudioClient`) was seeded from this
working tree, per the Task 20 addendum.

| Item | Value |
| --- | --- |
| Portal | `http://localhost:8001` (`portal-app-1`, `portal-builder-1`) |
| Runtime | `js/studio/quant-runtime.js?v=1788942861`, `quant-runtime-sass.js?v=mtttj6h1` |
| Template commit | `feat/template-build` @ `5c88957` |
| Demo session | `storage/app/studio-demo/oNC8Hn9…QlUS` (removed after the run) |
| Entry URL | `/studio/demo/main/files?collection=pages&slug=about-us` |
| rsync exclusions | `node_modules`, `dist`, `dist-story-parity`, `.upstream`, `.superpowers`, `test-results`, `.story-parity-results`, `tests/story-parity/fixtures`, `.git` (650 files, 21 MB copied) |

### Scratch-only workarounds applied to the demo copy

Both changes were made ONLY in the demo session directory. This repository is
unchanged.

1. `src/civictheme/js/behaviours/responsive.js` line 147: `…)$\`` → `…)[$]\``
   (defect R1 below).
2. Every `@civictheme/{base,atoms,molecules,organisms}/X` import rewritten to
   `@/civictheme/components/{00-base,01-atoms,02-molecules,03-organisms}/X`
   across 85 files (defect R2 below).

### Timing

| Phase | Time |
| --- | --- |
| `window.__studioPreview.ready` after navigation | 1.1 s |
| First preview paint, cold VFS (`/about-us`) | 54.4 s |
| First preview paint, warm (`/individuals`) | 36.9 s |
| SCSS edit → recoloured preview | 5.5 s |
| `StudioBuilder.build()` (35 pages, 46 files, 1.87 MB) | 10.1 s |

## Evidence

### (a) `/about-us` renders with CivicTheme styling — PASS (with workarounds)

`docs/superpowers/verification/2026-09-09-studio-gate/a-about-us-preview.png`

Site alert, header, primary navigation with the active trail, decorative banner
with its background image, breadcrumb and side navigation all render. Counters:
180 `ct-*` elements, 457,055 bytes of inline compiled CSS, 0 `[object Object]`,
0 render errors.

Before the workarounds the same URL produced a full-page render error
(`00-render-error-before-workarounds.png`).

### (b) `bannerType` enum dropdown and re-render — PASS

`b-bannertype-large.png`

The banner carries the click-to-edit annotation `data-quant-component="Banner"`.
The Fields panel derives `#field-bannerType` from the content schema as a select
with exactly `— Select —`, `Default`, `Large`. Selecting `Large` re-rendered the
preview immediately (prop-override path, < 500 ms): the banner element went from
`ct-banner ct-theme-dark ct-banner--decorative` to
`… ct-banner--decorative ct-banner--large`, and the document became `UNSAVED`.

### (c) SCSS `brand1` recolours without a full reload — PASS

`c-scss-brand1-recolour.png`

`src/civictheme/scss/variables.base.scss`, `brand1` in the FULL
`$ct-colors-brands` map, `#00698f` → `#c2185b`. The computed
`--ct-color-light-brand1` on the preview document changed after 5.5 s with no
iframe reload; reverting the file changed it back. Resource timing for the page:

```
quant-runtime.js?v=1788942861   start 1577 ms   754,143 B
astro.wasm?v=1788939541         start 1874 ms
quant-runtime-sass.js?v=mtttj6h1 start 4241 ms   (1 entry — loaded once)
```

### (d) In-browser `StudioBuilder` build — PARTIAL

`new window.StudioBuilder(window.__studioPreview, null).build(cb)`. Note the
callback is a PROGRESS callback; the manifest arrives on the returned promise,
and `manifest.files` is a `Map`, not an object.

| Counter | Value |
| --- | --- |
| Build time | 10.1 s |
| Pages / assets / public files | 35 / 11 / 5 |
| Manifest files, total size | 46, 1,869,932 B |
| CSS files, bytes | 1, 453,388 B |
| CSS contains `.ct-button` | yes |
| CSS contains `--ct-color-light-brand1` | yes |
| `[object Object]` in output | 0 |
| Warnings | 1 — `Endpoint skipped: Unsupported OS: browser` (the OG endpoint) |
| Errors | **15** |

All 15 errors are one message on the 15 `/components/*` reference pages:
`component-demos: no story fixtures found under src/data/component-demos — run
npm run demos:sync`. The 171 fixture JSON files ARE mounted in the VFS
(`fs.exists('/src/data/component-demos/00-base/icon/Icon.json')` is true), so
this is limitation R3 below, not missing content.

### (e) MDX page with components — FAIL

`e-individuals-mdx-error.png`

The page shell renders, then the MDX body stops at its first component tag:
`/individuals` → ``Expected component `Grid` to be defined``, `/about-us` →
``Expected component `TableOfContents` to be defined``. The component map passed
as `<Content components={components} />` is not applied (limitation R4).

## Follow-ups (quant-runtime / portal — NOT fixed here)

### R1 — defect: `` $` `` in a hoisted script corrupts the compiled page module

Any project whose hoisted `<script>` graph contains the two characters `` $` ``
fails to render every page that uses that layout, with
`Parse error @:<line>:<col>`.

The runtime inlines the bundled hoisted script into the compiled page module as
`hoisted: [{ type: "inline", value: "…" }]`. The captured `bundleEntry` output
was truncated mid-string exactly at the `` $` `` in CivicTheme's
`responsive.js`:

```js
const regex = `^(<|>|=|>=|<=|<>)?(${names.join('|')})$`;   // ← the trailing $`
```

The 59,337-byte bundle survived only 36,871 raw characters, ending at
`…join("|")})` followed immediately by the module prelude. That is the signature
of a `String.prototype.replace()` call using the bundle as the REPLACEMENT
string: JS expands `` $` `` to "the text before the match". Fix: pass a replacer
function, or escape `$` in the replacement.

Proof: changing that one character in the demo copy made every page render.

### R2 — limitation: only the `@/` alias is honoured; other tsconfig `paths` become stubs

`compiler/vfs-plugin.ts` hardcodes `^@\/` → `/src/`. Any other tsconfig
`paths` entry (here `@civictheme/*`) is treated as a bare npm specifier: the
browser requests it from jsDelivr (`…/npm/@civictheme/organisms/Banner.astro/+esm`
→ 404, 27 of them on boot), the resolver falls back to an empty Proxy stub, and
every such component renders as the literal `[object Object]`. `astro.config.mjs`
`vite.resolve.alias` is not read either, so a project cannot work around it in
config.

Two possible fixes, in preference order: (i) read `tsconfig.json` `paths` (and
`vite.resolve.alias`) in the VFS plugin; (ii) at minimum, surface a hard error
instead of silently substituting a stub that stringifies as `[object Object]`.

Template-side workaround that works today: express every alias under `@/`
(`@/civictheme/components/01-atoms/Link.astro`), which resolves identically in a
real `astro build`.

### R3 — limitation: `import.meta.glob` with `**` returns nothing

`import.meta.glob('/src/data/component-demos/**/*.json', { eager: true })`
resolves to an empty object even though all 171 files are mounted. This fails 15
of the 35 built pages.

### R4 — limitation: the MDX `components` prop is ignored

`<Content components={components} />` does not register the map, so MDX bodies
using bare component tags fail with ``Expected component `X` to be defined``.
This is the template's whole content-authoring model (Studio editors never write
an import line), so it is the highest-value fix of the four.

## Not done

Full CDN publish. Demo mode has no CDN project, per the Task 20 addendum. The
container publish path was verified separately for the Sass sub-project.

## Cleanup

The demo session directory was removed after the run, so the portal's demo
returns to its seed template.
