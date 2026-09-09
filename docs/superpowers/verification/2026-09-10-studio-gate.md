# Studio gate re-run — `ssg-astro-studio-civictheme` (2026-09-10)

**Status: PASS.** An unmodified checkout of this template renders, builds and
maps MDX components inside Quant Studio with no workarounds. This re-run
supersedes the PARTIAL result in `2026-09-09-studio-gate.md`; the four
quant-runtime follow-ups it listed (R1–R4) are fixed.

## Runtime fixes verified

| Defect | quant-runtime commit | Evidence here |
| --- | --- | --- |
| R1 `` $` `` in a hoisted script truncated the page module | `ec31906` | every page renders; 0 `Parse error` |
| R2 only `@/` alias honoured; `@civictheme/*` became `[object Object]` stubs | `4a79dfb` | `MdxComponents.ts` keeps its 25 `@civictheme/*` imports; 0 `[object Object]` |
| R3 `import.meta.glob<T>('…/**/*.json', { eager: true })` returned `{}` | `4a79dfb` | 17 `/components/*` pages build with demo markup |
| R4 `<Content components={…} />` ignored | `f485828`, `90a9e63` | bare `<TableOfContents>`, `<Grid>`, `<Webform>` + `<Fragment slot>` render |

Runtime: `develop` @ `90a9e63` (vendored into the portal as
`quant-runtime.js?v=1788986621`; builder container restarted). Portal branch
carries the `.scss` allowlist commit `5a6c3eeb`.

## How it was run

Same procedure as 2026-09-09 (Studio demo mode, no GitHub repository). The
demo session directory lives inside `portal-app-1` (not bind-mounted), so the
working tree was copied with `tar | docker exec -i … tar -x` into
`storage/app/studio-demo/<session>/_branches/main` with the same exclusions
(656 files), then `apachectl graceful`, `php artisan cache:clear`,
`indexedDB.deleteDatabase('StudioVfsCache')` and a hard reload.

| Item | Value |
| --- | --- |
| Portal | `http://localhost:8001` |
| Template commit | `feat/template-build` @ `e59b86d` (no scratch changes) |
| Demo session | `dkMeCD…tFOq` (removed after the run) |

## Evidence

### (a) `/about-us` — PASS (`a-about-us-toc-mapped.png`)

The page uses a bare `<TableOfContents … />` tag with no import line. In the
preview: 187 `ct-*` elements, 1 `.ct-table-of-contents` with 2 links, 457,055
bytes of compiled CSS, 0 `[object Object]`, 0 `Parse error`, 0 render-log
errors.

### (d) In-browser `StudioBuilder` build — PASS

| Counter | 2026-09-09 | 2026-09-10 |
| --- | --- | --- |
| Pages | 35 | **50** (the 15 failing `/components/*` pages now build, plus pager pages) |
| Errors | 15 | **0** |
| Warnings | 1 (OG endpoint skipped in the browser) | 1 (same) |
| `[object Object]` / `Expected component` / `no story fixtures` in any HTML | — | **0** |
| CSS bytes; contains `.ct-button`; contains `--ct-color-light-brand1` | 453,388; yes; yes | 453,755; yes; yes |
| Build time | 10.1 s | 9.4 s |

Every one of the 17 `/components/*` reference pages carries CivicTheme demo
markup (160–2,009 `class="ct-` occurrences each).

### (e) MDX pages with bare component tags — PASS (`e-contact-us-webform-mapped.png`)

`/individuals` (`<Grid>` + `<PromoCard>`), `/contact-us` and `/subscribe`
(`<Webform>` with a `<Fragment slot="referencedWebform">` child) render in the
preview and in the build with 0 `Expected component` errors. The first run
exposed that `Fragment` must not be required from the components map; fixed in
`90a9e63` and re-verified.

### Not re-run

(b) enum click-to-edit and (c) SCSS hot theming passed on 2026-09-09 and touch
no changed code path. The CDN publish still needs a real project (demo mode has
no CDN project).

## Cleanup

The demo session directory was removed from the container after the run.
