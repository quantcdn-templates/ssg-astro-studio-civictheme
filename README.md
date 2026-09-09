# CivicTheme for Astro + Quant Studio

The CivicTheme design system (Salsa Digital) ported to Astro, editable in Quant Studio.
See `NOTICE.md` for licence. Quick start: `npm install && npm run dev`.

## Routes

Pages in the `pages` collection are served at their folder path; the entry with id `index` is
the home page. The `events`, `news` and `publications` collections each get a listing at
`/<collection>` and a detail page at `/<collection>/<id>`. Listings show ten entries per page
(`PAGE_SIZE` in `src/lib/pagination.ts`); page 1 stays at `/<collection>` and later pages are
served under a `page/` segment — `/events/page/2`, `/events/page/3`, … That segment keeps the
pager out of the detail route's namespace, so an entry whose id is a bare number cannot
collide with a pager page.

## Content model

`src/content/pages/*.mdx` is the `pages` collection (schema in
`src/content.config.ts`): `title`, `summary`, `theme`, `bannerType`
(`default`/`large`), `bannerImage`, `bannerTheme`, `showBreadcrumb`,
`showLastUpdated`, `topics[]`, `section`, `draft`, `order`, `updated`. A
page's filename is its slug (`government.mdx` → `/government`), except
`index.mdx`, which is the home page. Set `section` (e.g. `audiences`,
`about`) on pages that should share a side navigation — `PageLayout`
builds it from every published page with the same `section`, ordered by
`order` then `title`. Set `updated` and `showLastUpdated: true` to show a
"Last updated" line.

The ten demo pages (ported from the CivicTheme default content module)
show every MDX body pattern available: plain Markdown prose for a
`content` paragraph; `<ListingAuto collection="news|events|publications"
… />` for an automated listing (`<ManualList collection="…"
slugs={[…]} />` is the curated equivalent for one of those collections);
`<Grid>` with `PromoCard`/`NavigationCard`/`SubjectCard` children (each
wrapped in a `col-xxs-12 col-m-<n>` div — `Grid`'s default slot expects
pre-wrapped columns) for a manual card list not backed by a collection —
the CivicTheme `manual_list` paragraph type; `<Callout>`/`<NextStep>` for
a call-to-action block; and `<Webform>` with a static HTML form
(`action="#"`) for a webform paragraph, since the template ships no
backend. `MdxComponents.ts` exposes every component these pages use as a
bare tag — no per-page imports.

Demo images live in `public/images/demo/` (from the CivicTheme default
content module) and are used as the `image` frontmatter on several
`events`/`news`/`publications` entries and as card images on the demo
pages. The site logo (`src/content/settings/site.json`) points at
`public/images/logo-light.svg` / `logo-dark.svg`, a plain text wordmark —
swap these for a real brand mark.

## Behaviours

This template does not enable Astro's `<ClientRouter>` (view transitions) — every
navigation is a full page load, which the vendored CivicTheme behaviours rely on to
re-initialise. See `PORTING.md` for why. (Task 19 expands this README further.)

## Parity with upstream

The ported components are checked against the pinned CivicTheme UI Kit
(`packages/twig`, commit `fe4291907b1ea15cfc0ea5d9ca47d31964a5b91a`) by two
independent oracles:

1. **Upstream's Jest snapshots** — `npm run test:parity` (697 cases). These
   cover the prop combinations upstream's own unit tests use.
2. **Upstream's Storybook stories** — the complete documented argument set for
   every variant, captured once into `tests/story-parity/fixtures/` (markup,
   screenshots and args) so the suite runs without the upstream checkout.

```bash
npm run test:story-parity          # HTML comparison, no browser
npm run test:story-parity:visual   # pixel comparison, builds the site and runs Playwright
```

The coverage is not uniform: 43 of the 171 stories are wrapper-only (most of
their markup arrives pre-rendered in the story's args, so a pass proves the
wrapper, not the children), and 8 components have no upstream story at all —
see `PARITY.md` and `tests/story-parity/fixtures/SOURCE.md` for exactly which.

`PARITY.md` lists every story with its HTML result, its pixel delta, and the
reason for any accepted difference. Regenerate it with
`node scripts/story-parity-report.mjs`.

The visual suite builds the whole site and drives Chromium, so it takes a few
minutes, and it needs network access: CivicTheme loads Lexend and Public Sans
from Google Fonts, and an offline run fails on font-metric differences rather
than passing quietly.
