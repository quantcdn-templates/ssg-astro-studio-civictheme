# CivicTheme for Astro + Quant Studio

The CivicTheme design system (Salsa Digital) ported to Astro, editable in Quant Studio.
See `NOTICE.md` for the licence. Quick start: `npm install && npm run dev`.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## What's inside

- **77 components** ported from the CivicTheme UI Kit (`packages/twig`, v1.13.0, commit
  `fe4291907b1ea15cfc0ea5d9ca47d31964a5b91a`): 7 base, 22 atoms, 30 molecules, 18 organisms —
  every layer's Twig template, minus Storybook-only `*.stories.twig` files, which are not
  components. Each is a hand-ported `.astro` file under `src/civictheme/components/`.
- **Seven content collections**: `pages` (MDX), `events`/`news`/`publications` (MDX, with
  listing and detail routes), `alerts` (JSON), `navigation` (JSON), `settings` (JSON).
- **A components reference** at `/components/…` — one page per family (banners, promo,
  campaign, callout, cards, lists, slider, accordion, tabs, table, forms, navigation, footer,
  alerts, base) showing every variant from upstream's own Storybook args.
- **Ten demo pages** ported from CivicTheme's default content module, and sample `events`,
  `news` and `publications` entries.

## Content model

`src/content.config.ts` defines seven collections with Zod schemas (Studio-friendly types
only: string, enum, boolean, coerced date, number, string array):

| Collection     | Format | Fields                                                                                                                                                                               |
| -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pages`        | MDX    | `title`, `summary`, `theme`, `bannerType` (`default`/`large`), `bannerImage`, `bannerTheme`, `showBreadcrumb`, `showLastUpdated`, `topics[]`, `section`, `draft`, `order`, `updated` |
| `events`       | MDX    | `title`, `summary`, `startDate`, `endDate`, `location`, `image`, `topics[]`, `theme`, `registrationUrl`, `draft`                                                                     |
| `news`         | MDX    | `title`, `summary`, `date`, `updated`, `author`, `image`, `topics[]`, `featured`, `draft`                                                                                            |
| `publications` | MDX    | `title`, `summary`, `date`, `image`, `topics[]`, `fileUrl`, `fileFormat` (`pdf`/`docx`/`xlsx`/`other`), `fileSize`, `draft`                                                          |
| `alerts`       | JSON   | `title`, `message`, `type` (`information`/`warning`/`error`/`success`), `startDate`, `endDate`, `dismissible`, `active`                                                              |
| `navigation`   | JSON   | one file per menu (`primary`, `secondary`, `footer`); flat rows `{ label, url, parent? }`                                                                                            |
| `settings`     | JSON   | `name`, `tagline`, `logoLight`, `logoDark`, `footerText`, `acknowledgement`, `social[]` (`{ platform, url }`), `theme`, `search` (see [Search](#search))                             |

A `pages` entry's filename is its slug (`government.mdx` → `/government`), except `index.mdx`,
which is the home page. Set `section` (e.g. `audiences`, `about`) on pages that should share a
side navigation — `PageLayout` builds it from every published page with the same `section`,
ordered by `order` then `title`. Set `updated` and `showLastUpdated: true` to show a "Last
updated" line.

Demo images live in `public/images/demo/` (from the CivicTheme default content module) and are
used as the `image` frontmatter on several `events`/`news`/`publications` entries and as card
images on the demo pages. The site logo (`src/content/settings/site.json`) points at
`public/images/logo-light.svg` / `logo-dark.svg`, a plain text wordmark — swap these for a real
brand mark.

## Routes

Pages in the `pages` collection are served at their folder path; the entry with id `index` is
the home page. The `events`, `news` and `publications` collections each get a listing at
`/<collection>` and a detail page at `/<collection>/<slug>`. Listings show ten entries per page
(`PAGE_SIZE` in `src/lib/pagination.ts`); page 1 stays at `/<collection>` and later pages are
served under a `page/` segment — `/events/page/2`, `/events/page/3`, … That segment keeps the
pager out of the detail route's namespace, so an entry whose id is a bare number cannot
collide with a pager page. Canonical URLs are always extension-less (`cleanPath`).

## Writing pages in MDX

`MdxComponents.ts` exposes CivicTheme components as bare tags in MDX bodies — no per-page
imports needed. The full list: `Promo`, `Campaign`, `Slider`, `Slide`, `Webform`, `Callout`,
`NextStep`, `Accordion`, `Tabs`, `BasicContent`, `Attachment`, `Figure`, `TableOfContents`,
`Map`, `VideoPlayer`, `Table`, `Iframe`, `Heading`, `Paragraph`, `Button`, `Link`, `Grid`,
`PromoCard`, `NavigationCard`, `SubjectCard`, plus the template-level `ManualList` and
`ListingAuto`.

`Promo`:

```mdx
<Promo
  title="Sign up for industry news and updates"
  content="A short paragraph of supporting copy goes here."
  link={{ text: 'Sign up', url: 'https://example.com', isNewWindow: true, isExternal: true }}
  isContained={true}
/>
```

`Callout`:

```mdx
<Callout
  title="Learn more about us"
  content="Find out who we are, what we do, and how we serve the community."
  links={[{ text: 'About us', url: '/about-us' }]}
  verticalSpacing="bottom"
/>
```

`ListingAuto` (automated listing, backed by a collection — `ManualList` is the curated
equivalent for a fixed set of `slugs`):

```mdx
<ListingAuto collection="news" title="Latest news" limit={3} />
```

Plain Markdown prose works for a `content` paragraph; `<Grid>` with `PromoCard`/
`NavigationCard`/`SubjectCard` children (each wrapped in a `col-xxs-12 col-m-<n>` div — `Grid`'s
default slot expects pre-wrapped columns) covers a manual card list not backed by a collection
— the CivicTheme `manual_list` paragraph type; `<Webform>` renders a static HTML form
(`action="#"`), since the template ships no backend.

**Autoescape note**: every Slot-documented prop (`title`, `content`, `summary`, `caption`, …)
is rendered with `set:html` to keep fidelity with upstream, which documents these as
HTML-bearing strings. Never wire untrusted input (e.g. user-submitted content) into one of
these props — they are not escaped.

**Slots**: every Slot-documented prop is also a real Astro named slot, with the string prop as
a fallback, so MDX authors can pass plain text or a real Astro child instead of a prop. A
conditional `<Fragment slot="…">` still registers the slot at compile time even when its branch
never renders, which can widen a component's root gate — see `PageBanner.astro` and
`PORTING.md` for the pattern.

## Theming

- `src/civictheme/scss/variables.base.scss` and `variables.components.scss` (siblings of
  `00-base/` inside `scss/`) are the editing surface. They ship populated with CivicTheme's
  default palette. A `$ct-colors-brands` override must supply the **full** brand map
  (`brand1`–`brand3` for both light and dark) — CivicTheme raises a build-time `@error` on a
  partial map.
- `src/civictheme/scss/index.scss` imports the vendored SCSS tree in layer order; never edit
  it or anything under `scss/00-base/` … `scss/04-templates/` by hand — a vendoring refresh
  overwrites them.
- `src/styles/global.scss` is the single stylesheet entry point (imported once from
  `BaseLayout`): it sets `$ct-assets-directory`, imports `civictheme/scss/index.scss`, then
  carries any site-level overrides.
- Light/dark is per-component: a `theme` prop (`'light'` | `'dark'`, default `'light'`) sets
  `ct-theme-light`/`ct-theme-dark` on that component's root, exactly as CivicTheme does. Page
  and section frontmatter carry their own `theme` field; there is no JS dark-mode toggle.

## Updating CivicTheme

```bash
npm run vendor -- <path-to-uikit-checkout>
```

This re-copies SCSS, JS behaviours, icons, fonts, backgrounds and logos from a `packages/twig`
checkout into `src/civictheme/scss|js|assets`, and refreshes the component-demo fixtures. It
never touches `src/civictheme/components/**` — those `.astro` files are hand-maintained, since
Twig has no direct compile target. After vendoring, run:

```bash
npm run test:parity
```

Any prop, class or markup drift between the new upstream snapshots and the ported components
shows up as failing parity cases, naming exactly which component(s) changed.

## Testing

```bash
npm test          # vitest: unit tests, parity (697 cases), story parity, and the build test
npm run test:e2e  # Playwright: behaviour smoke tests + accessibility (axe) across every page
```

The ported components are checked against the pinned CivicTheme UI Kit by two independent
oracles:

1. **Upstream's Jest snapshots**, run through Twig.js (the same engine upstream's own
   Storybook/Jest setup uses, not server-side PHP Twig) — `npm run test:parity` (697 cases),
   covering every prop combination upstream's own unit tests use. Two Twig.js engine quirks
   are reproduced rather than "fixed" so the port stays faithful to the oracle it's actually
   checked against (`x ? x : y` evaluating to `y`, not `x`, when `x` is undefined; and
   `undefined == false` evaluating to `true`) — see `PORTING.md` for both.
2. **Upstream's Storybook stories** — the complete documented argument set for every variant,
   captured once into `tests/story-parity/fixtures/` so the suite runs without an upstream
   checkout:

   ```bash
   npm run test:story-parity          # HTML comparison, no browser — 171 stories
   npm run test:story-parity:visual   # pixel comparison, builds the site and runs Playwright
   ```

   171 stories: 158 exact HTML matches, 13 accepted (documented, non-fidelity) differences;
   165 measured within pixel tolerance, 2 unmeasurable (the component renders no visible box —
   comparing two 1x1 transparent captures proves nothing, so these do not count as passing),
   4 with no page to screenshot (`04-templates` is not a ported layer). Coverage is not
   uniform: 43 of the 171 stories are wrapper-only — more than half their fixture HTML arrives
   pre-rendered in the story's own args, because upstream's `*.stories.data.js` builds it by
   calling other Twig templates and passing the resulting markup in as a string prop. A pass
   on one of these proves the wrapper renders correctly, not that the (separately covered)
   children do. `PARITY.md` (regenerate with `node scripts/story-parity-report.mjs`) lists
   every story's result, its pixel delta where measured, and the reason for any accepted
   difference — it states "exact match" vs "wrapper-only" honestly per row rather than a
   single pass/fail. The visual suite needs network access (CivicTheme loads Lexend and Public
   Sans from Google Fonts) and takes a few minutes.

Accessibility is checked with axe-core across every reference page, every `/components/<family>`
page, and the paginated listing/detail pages — 38 assertions (37 pages plus one summary
assertion), zero serious/critical violations. Every page assertion also checks the route
returns HTTP 200, so a missing page cannot pass as a clean scan. `tests/e2e/search.spec.ts` also
scans each state of the search page (not set up, results, no results, error) against a mocked
search API, and fails on any axe violation.
A handful of selectors are excluded with a documented reason (vendored markup gaps that the
markup-fidelity rule forbids fixing inside the component) — see the comment block at the top of
`tests/e2e/a11y.spec.ts`.

CI's `build` job runs `npm run check` (`astro check` plus `prettier --check`), then `npm test`,
which includes the build test (`astro build` against the real demo content, several minutes) as
part of the same vitest run — a CI failure there means the production build itself is broken,
not just a unit assertion. After the build it installs Chromium and runs `npm run test:e2e`
(the accessibility and behaviour suites) against `astro preview` of that build. The whole job
takes roughly 10-15 minutes, most of it the two builds.

The repository clone is about 27 MB. The story-parity fixtures (`tests/story-parity/fixtures/`,
captured upstream HTML and screenshots) and the demo images under `public/` are committed
deliberately: both oracles, and the demo site, must run from a plain clone with no upstream
CivicTheme checkout and no asset download step.

## Behaviours

This template does not enable Astro's `<ClientRouter>` (view transitions) — every navigation is
a full page load. The vendored CivicTheme behaviours (`src/civictheme/js/behaviours/*.js`)
self-initialise at module-evaluation time with a top-level `querySelectorAll(...).forEach(...)`,
matching upstream verbatim; none of them listen for `DOMContentLoaded`, and `tabs.js` and
`skip-to-target.js` have no guard against double-initialising. A full page load re-runs this
init exactly once per page, safely; a client-side route swap would run it again on the same DOM
and attach duplicate listeners. See `PORTING.md` for the upstream change (exported
initialisers, added guards) that would be needed to make view transitions safe.

## Search

`/search` is a native search page on Quant AI Search. It keeps the
CivicTheme search form (a plain GET form, `?q=`) and renders results as CivicTheme `Snippet`s in
a `List`.

When the project is connected to Quant Studio, Studio provisions a Quant AI Search site for each
environment, indexes every page on publish, and passes the site's ID to the build as
`PUBLIC_QUANT_SEARCH_SITE_ID`. The ID is injected per environment and must never be committed.
With it set, the page's script (`src/lib/quant-search-dom.ts`) reads `q` from the URL (two
characters or more), sends `POST /v1/public/sites/<site ID>/search` to
`https://ai-search.quantcdn.io` with no API key, and shows the results, a results count in an
`aria-live` region, a "No results" state or an error message. Set `PUBLIC_QUANT_SEARCH_API_URL`
to point at another Quant AI Search origin (for example a staging one).

`src/content/settings/site.json` has a `search` object:

| Field          | Default | Meaning                                  |
| -------------- | ------- | ---------------------------------------- |
| `enabled`      | `true`  | Set `false` to turn the search page off. |
| `resultsLimit` | `10`    | Results per search (1–100).              |
| `placeholder`  | —       | Placeholder text for the search field.   |

With no site ID, or with `enabled: false`, the page makes no request and shows a "Search is not
set up for this site yet." Callout under the form. A site deployed outside Studio (for example
with the included GitHub Action) is not indexed on publish: set `PUBLIC_QUANT_SEARCH_SITE_ID` at
build time and let the Quant AI Search crawler index the site.

`quant.studio.json` carries `"_search": { "native": "/search" }` so Studio can tell that this
template ships its own search page.

## Known limitations

| Component                     | Limitation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Table`                       | Drupal's `{ attributes, cols }` row/footer shape is not supported — only the two legacy footer shapes and plain-string rows/cells are ported (no upstream snapshot exercises the Drupal shape).                                                                                                                                                                                                                                                                                                                                           |
| `Slider`                      | The root `aria-label` always reads the `title` prop (falling back to `'Slider'`); a `title` passed only as a slot does not reach it.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Alert`                       | Alerts are rendered at build time, so there is no `data-alert-endpoint` and no polling: `SiteAlerts.astro` supplies the `data-component-name="ct-alerts"` wrapper `alert.js` initialises on, and the dismiss listener comes from the shim in `src/civictheme/js/civictheme.js` (`alert.js` attaches its own only to fetched alerts). A dismissal is remembered in the `ct-alert-hide` cookie exactly as upstream does, and re-applied on the next page load — so a dismissed alert can flash briefly before the module script removes it. |
| `ListingAuto` / `ListingGrid` | Do not pass a `verticalSpacing` prop through to the underlying `List`, even though `List` supports one.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Demo forms                    | The contact and subscribe forms are static demos: `method="get"` with `action="#"`, no backend. Point them at a form handler before using them.                                                                                                                                                                                                                                                                                                                                                                                           |
| Favicon                       | `public/favicon.svg` is a plain placeholder mark, not a real organisation logo — replace it (and the referenced logos in `src/content/settings/`) for a production site.                                                                                                                                                                                                                                                                                                                                                                  |
| Community Engagement          | `/community-engagement` is built and reachable by URL but deliberately absent from the primary menu, matching the Drupal demo site's own menu structure.                                                                                                                                                                                                                                                                                                                                                                                  |
| `demo7.jpg`                   | The cards and lists reference pages (`/components/cards`, `/components/lists`) request `/civictheme/demo/images/demo7.jpg`, which 404s: the upstream twig package's demo fixtures reference that image but do not ship it. The affected cards render without their image.                                                                                                                                                                                                                                                                 |

## Editing with Quant Studio

Connect this project to Quant Studio in the dashboard to get:

- Visual preview with click-to-edit
- Schema-driven forms for frontmatter (dropdowns for enums, toggles for booleans, number inputs)
- MDX component rendering in preview
- AI content generation
- Branch environments for drafts and review

This template needs quant-runtime ≥ `90a9e63` in Studio: Sass support (`34591bf`) for live
editing of `variables.base.scss`/`variables.components.scss`, plus tsconfig `paths` aliases,
`import.meta.glob` with `{ eager: true }`, and the MDX `<Content components={…} />` map
(`ec31906`…`90a9e63`). The portal also needs its `.scss` file-type allowlist change (portal
commit `5a6c3eeb`). Without these, the Studio project can still be created and edited, but the
preview shows `[object Object]` for aliased components and bare MDX component tags fail.

### Inserting components

Studio's **Insert** button lists the components in the `_components` key of `quant.studio.json`, grouped as
Content, Listings, Media and Layout, with a form for each component's props and sensible
defaults. Inserted tags render through the MDX components map (`src/components/MdxComponents.ts`),
so the manifest sets `"imports": "none"`. Blocks can be reordered by dragging them in the
preview. To expose another component, add its path to the manifest or right-click the file in
Studio and choose "Make insertable".

## Deploying to QuantCDN

1. Push this repo to GitHub
2. Create a project in the [Quant dashboard](https://dashboard.quantcdn.io)
3. Add `QUANT_CUSTOMER`, `QUANT_PROJECT` as repository variables and `QUANT_TOKEN` as a secret
4. Push to `main` — the included GitHub Action builds and deploys automatically

## Licence

GPL-2.0-or-later. `LICENSE.txt` is CivicTheme's own licence text. `NOTICE.md` credits Salsa
Digital with the upstream repository, version and commit this template is pinned to.
Everything under `src/civictheme/` is a derived work of the CivicTheme UI Kit — SCSS and JS are
vendored unchanged, `.astro` components are hand-ported and hand-maintained. The rest of this
repository (configuration, layouts, demo content) is distributed under the same licence.
