# CivicTheme for Astro + Quant Studio

The CivicTheme design system (Salsa Digital) ported to Astro, editable in Quant Studio.
See `NOTICE.md` for licence. Quick start: `npm install && npm run dev`.

## Behaviours

This template does not enable Astro's `<ClientRouter>` (view transitions) — every
navigation is a full page load, which the vendored CivicTheme behaviours rely on to
re-initialise. See `PORTING.md` for why. (Task 19 expands this README further.)
