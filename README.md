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

## Behaviours

This template does not enable Astro's `<ClientRouter>` (view transitions) — every
navigation is a full page load, which the vendored CivicTheme behaviours rely on to
re-initialise. See `PORTING.md` for why. (Task 19 expands this README further.)
