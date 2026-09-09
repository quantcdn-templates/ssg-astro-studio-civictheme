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
