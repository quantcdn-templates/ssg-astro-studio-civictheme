# ssg-astro-studio-civictheme — design

**Date:** 2026-09-07
**Status:** Approved design, awaiting implementation plan
**Sub-project:** 2 of 3 (1: runtime Sass support — merged to quant-runtime `develop` 34591bf;
3: Studio "Insert component" for MDX — not started)

## Goal

A Quant Cloud SSG template that ports the Salsa Digital CivicTheme UI Kit
(https://github.com/civictheme/uikit, `packages/twig`, v1.13.0, GPL-2.0-or-later) to Astro
for editing in Quant Studio, with a demo site that covers every CivicTheme landing page type
and every component variant.

## Decisions made during brainstorming

| Decision | Choice |
|---|---|
| Demo scope | Both: the ten CivicTheme default demo pages AND a components section with every variant |
| Foundation | Clean Astro project, CivicTheme is the only style system (no Tailwind). Keep Studio plumbing, sitemap, robots, MDX, OG images. Drop RSS and the JS dark-mode toggle |
| Collections | `pages`, `events`, `news`, `publications`, `alerts` + data collections `navigation`, `settings` |
| Licence | Template ships GPL-2.0-or-later with `LICENSE.txt`, `NOTICE.md` crediting Salsa Digital (QuantCDN and Salsa are partners) |
| Port method | Approach A: markup-faithful port of all 91 components, converter script for skeletons, snapshot parity harness against upstream Jest snapshots |
| Authoring model | MDX pages composing components (Studio renders `z.array`/`z.object` as raw JSON, so no block arrays in frontmatter) |

## Section 1: Repository layout and licence

Location: `~/apps/quant-templates/ssg-astro-studio-civictheme`, its own git repository, later
published to the `quantcdn-templates` GitHub org.

```
ssg-astro-studio-civictheme/
├── LICENSE.txt                 # GPL-2.0-or-later, from CivicTheme
├── NOTICE.md                   # credits Salsa Digital, upstream repo, version, commit
├── README.md                   # quick start, content model, theming, licence notes
├── quant/meta.json             # template_type ssg, requires_db false, og_images true,
│                               # categories javascript/astro/studio/civictheme
├── .github/workflows/{deploy.yml,ci.yml}
├── astro.config.mjs            # output static, sitemap, robots-txt, mdx; no Tailwind
├── package.json                # astro, @astrojs/mdx, @astrojs/sitemap, astro-robots-txt,
│                               # satori, @resvg/resvg-js, sass (dev); NO lock file committed
├── scripts/
│   ├── vendor-civictheme.mjs   # copies SCSS, JS, icons, fonts, backgrounds, logos from a
│   │                           # uikit checkout; writes scss/index.scss (explicit imports),
│   │                           # Icon symbol map, NOTICE.md version/commit
│   └── twig-to-astro.mjs       # one-shot skeleton generator; never re-run on finished files
├── src/
│   ├── civictheme/             # everything derived from the UI Kit (GPL subtree)
│   │   ├── components/{00-base,01-atoms,02-molecules,03-organisms}/<PascalName>.astro
│   │   ├── scss/               # vendored SCSS tree + index.scss
│   │   ├── js/                 # vendored behaviours + civictheme.js init module
│   │   ├── assets/{icons,fonts,backgrounds,logos}
│   │   ├── variables.base.scss
│   │   └── variables.components.scss
│   ├── components/             # template-level compositions: SiteHeader, SiteFooter,
│   │                           # PageBanner, ListingAuto, ManualList, Alerts, …
│   ├── layouts/{BaseLayout,PageLayout,DetailLayout}.astro
│   ├── content.config.ts
│   ├── content/{pages,events,news,publications,alerts,navigation,settings}/
│   ├── pages/                  # routes, listings, /components/*, og/[...slug].png.ts, 404
│   └── styles/global.scss      # $ct-assets-directory, imports civictheme index, overrides
└── public/civictheme/{fonts,backgrounds,logos}/
```

- `src/civictheme/` is the only tree the vendoring script overwrites. Template-level code
  and demo content live outside it, so an upstream refresh never touches them.
- Path aliases: `@civictheme/base/*`, `@civictheme/atoms/*`, `@civictheme/molecules/*`,
  `@civictheme/organisms/*` → the four layer folders. MDX pages import from these.

## Section 2: Component port and parity harness

**Naming and shape**

- One Twig component → one PascalCase `.astro` file in the same layer folder
  (`02-molecules/promo-card/promo-card.twig` → `components/02-molecules/PromoCard.astro`).
- Props keep CivicTheme names in camelCase (`is_title_click` → `isTitleClick`);
  `modifier_class` → `class`; Twig `attributes` → Astro rest attributes (`{...rest}`).
- Twig slots (`content_top`, `image_over`, …) and named blocks → Astro named slots with the
  camelCase name. Default `theme` is `light`.
- Rendered DOM and every `ct-*` class are identical to upstream, so vendored SCSS and JS work
  unchanged and future UI Kit updates stay diffable.

**Converter script** (`scripts/twig-to-astro.mjs`)

Reads each Twig file once and emits a skeleton: `Props` interface from the doc-comment header
(types + defaults), imports for every `{% include '@layer/name/name.twig' %}`, `{% set %}`
class-composition translated to expressions, slot placeholders for blocks. Mechanical control
flow is translated; the rest is left as a `TODO` comment. Every component is finished by hand.

**Icons**

The 59 SVGs become an inline symbol map generated into `00-base/Icon.astro` by the vendoring
script: `<Icon symbol="right-arrow-2" size="regular" />` renders upstream's SVG, no runtime
fetch.

**JS behaviours**

The 18 behaviour files are vendored unchanged. `src/civictheme/js/civictheme.js` imports them
and initialises on `DOMContentLoaded` and on Astro page-swap events; loaded once from
`BaseLayout` as a hoisted script. Any Drupal-global assumption is shimmed in the init module,
never by editing a vendored file.

**Parity harness** (`tests/parity/`)

- vitest + Astro container API. For each `.astro` component, one case per upstream Jest test
  case: render with the upstream test's props, compare against the upstream `.snap` HTML.
- Normalisation before compare: collapse whitespace, sort attributes, drop empty text nodes,
  strip `data-astro-cid-*`.
- Upstream Drupal-only constructs (`DrupalAttribute`) are replaced by plain attributes.
- Definition of done per component: parity cases pass AND it appears on the components demo
  page. After a vendoring refresh, failing cases identify exactly which components changed.

**Order of work**: 00-base → 01-atoms → 02-molecules → 03-organisms (each layer imports
only from layers below). `04-templates` become the layouts (Section 5).

## Section 3: Styles and theming

- `scripts/vendor-civictheme.mjs` copies the SCSS tree (minus `*.stories.scss`, `style.scss`,
  `style.stories.scss`) into `src/civictheme/scss/` and writes `index.scss` with explicit
  imports in layer order (variables first, then 00-base … 05-pages). Same approach as the
  runtime's CivicTheme fixture; compiles with Dart Sass 1.104 in ~0.5 s.
- `src/styles/global.scss` is the single stylesheet entry, imported once from `BaseLayout`:
  sets `$ct-assets-directory: '/civictheme/'` then imports the index; site overrides follow.
- Theming entry points: `src/civictheme/variables.base.scss` and
  `variables.components.scss` (the files `00-base/variables.scss` imports via
  `@import '../variables.base'`). Shipped populated with the CivicTheme default palette and a
  comment explaining the rule: a `$ct-colors-brands` override must supply the FULL map
  (brand1–3 for light AND dark) or CivicTheme raises `@error`. These files are the editor's
  theming surface in Studio; editing recompiles only dependants and hot-swaps the preview.
- Light/dark: per-component `theme` prop → `ct-theme-light`/`ct-theme-dark`, as in
  CivicTheme. Page/section frontmatter carries `theme: z.enum(['light','dark'])`; no JS
  toggle.
- Fonts and backgrounds → `public/civictheme/` so `url()` paths resolve identically in Studio
  preview and on the CDN. The vendoring script rewrites nothing inside SCSS.
- Components may add scoped `<style lang="scss">` that `@use`s CivicTheme mixins.

## Section 4: Content model and schemas

`src/content.config.ts`, Zod, Studio-friendly types only (string, enum, boolean, date, number,
string array, image path). No nested objects / object arrays in frontmatter.

| Collection | Format | Fields |
|---|---|---|
| `pages` | MDX | `title`, `summary`, `theme`, `bannerType` (default/large), `bannerImage`, `bannerTheme`, `showBreadcrumb`, `showLastUpdated`, `topics[]`, `section`, `draft`, `order`. Body = MDX composing components. Folder path = URL, breadcrumbs, side nav |
| `events` | MDX | `title`, `summary`, `startDate`, `endDate`, `location`, `image`, `topics[]`, `theme`, `registrationUrl`, `draft` |
| `news` | MDX | `title`, `summary`, `date`, `updated`, `author`, `image`, `topics[]`, `featured`, `draft` |
| `publications` | MDX | `title`, `summary`, `date`, `image`, `topics[]`, `fileUrl`, `fileFormat` (pdf/docx/xlsx/other), `fileSize`, `draft` |
| `alerts` | JSON | `title`, `message`, `type` (information/warning/error/success), `startDate`, `endDate`, `dismissible`, `active` |
| `navigation` | JSON data | one file per menu (`primary`, `secondary`, `footer`); flat rows `{ label, url, parent? }`; header builds the tree |
| `settings` | JSON data | `site.json`: name, tagline, logo light/dark, footer text, acknowledgement text, social links rows `{ platform, url }`, default `theme` |

- `ListingAuto.astro` = static counterpart of CivicTheme's automated list: collection,
  optional `topics` filter, sort, limit → correct card type. `ManualList.astro` takes slugs.
  Both usable inside MDX.
- Draft handling as in `ssg-astro-studio`: excluded from listings, feeds and build; still
  editable in Studio.

## Section 5: Demo site

- Content from the CivicTheme **default** content set ("Your organisation" placeholders,
  CivicTheme demo images, generic logo). No third-party brand.
- **Ten ported pages**: Home ("Your organisation's tagline"), About us, Contact us,
  For individuals, For businesses, For government, Community Engagement, News and events,
  Subscribe, CivicTheme in 60 seconds. Each MDX page mirrors the Drupal node's paragraph
  sequence component for component; automated lists → `<ListingAuto>`.
- **Sample entries**: 6 events, 6 news, 4 publications, 1 active alert; dates spread past and
  future to exercise pagination, filters and empty states.
- **Components section** `/components/…`: one page per organism/molecule family — banners
  (all variants, light/dark), promo, campaign, callout, next step, lists and cards (promo,
  event, publication, navigation, service, subject, snippet, fast fact), slider, accordion,
  tabs, table, form fields, navigation (header, mobile nav, side nav, breadcrumb, pagination,
  table of contents), footer, alert/message, and base (typography, colours, spacing, icons,
  grid). Variants and props come from upstream `*.stories.data.js`. Doubles as the editor's
  reference before inserting a component in MDX.
- **Layouts**: `BaseLayout` (head, skip link, alerts, header with primary/secondary menus,
  footer, JS init); `PageLayout` (banner, breadcrumb, optional side nav by section, last
  updated); `DetailLayout` (events/news/publications; matching banner variant + metadata).
- **Routes**: pages at folder path; `/events/`, `/news/`, `/publications/` listings + detail;
  `/components/…`; `/search` static placeholder using the search organism; `404`; sitemap;
  robots; `/og/[...slug].png` for all collections.

## Section 6: Studio and deployment

- Browser-compilable only: `.astro`, `.mdx`, `.scss` (sub-project 1), plain JS hoisted
  scripts, JSON data collections, the OG endpoint already proven under Studio. No Node-only
  import from any component or page. `sass` is a devDependency for local `astro build`.
- **Studio gate** (template is not done without it): create a Studio project from the
  template; open a demo page; click-to-edit on frontmatter; edit `variables.base.scss` and
  see the preview recolour; in-browser build with zero errors; publish to a stage project and
  confirm the published stylesheet contains CivicTheme rules. This also exercises the
  builder-container publish path sub-project 1 deferred.
- **Deployment**: `deploy.yml` (push to `main` → build → `quantcdn/deploy-action`),
  `ci.yml` (daily, Node 22, `npm install`, verify `dist/`). No lock file committed.
  `quant/meta.json` as in Section 1.
- **Scripts**: `dev`, `build`, `check` (astro check + prettier), `test` (vitest),
  `test:parity`, `vendor -- <uikit checkout>`.
- **Publishing after build** (listed for Stuart, not run): create
  `quantcdn-templates/ssg-astro-studio-civictheme`, push, add `quant/screenshot.png`,
  register in the portal template seed.

## Section 7: Testing

- **Parity suite**: one case per upstream Jest case (~300 across 91 components); in `npm test`.
- **Schema tests**: every demo content file parses; drafts excluded from listings;
  `ListingAuto` filter/sort correct.
- **Build test**: `astro build` succeeds; every demo route present; site CSS contains
  `.ct-button` and `--ct-color-light-brand1`; a brand override in `variables.base.scss`
  changes that property in built CSS.
- **JS behaviour smoke** (Playwright on built site): accordion opens, mobile nav opens, tabs
  switch, table of contents highlights on scroll.
- **Accessibility**: axe on components pages + ten demo pages, zero serious/critical.
- **Studio gate** recorded with evidence in the plan's final task.

## Risks

- **Port volume**: 91 components, ~300 parity cases. Mitigated by the converter, the
  layer order, and the harness as an objective definition of done. Work parallelises by
  layer.
- **Twig constructs without Astro equivalents** (Drupal `attributes` object, `|raw`
  filters, Twig `block` overrides used by Drupal templates). Resolved per component; recorded
  in a `PORTING.md` table.
- **Upstream refresh**: vendoring overwrites `src/civictheme/scss|js|assets` only; `.astro`
  components are hand-maintained and the parity harness reports drift.
- **GPL**: the whole template is GPL-2.0-or-later. Documented in README.
