/**
 * Axe exclusions shared by every e2e spec that runs an accessibility scan
 * (`a11y.spec.ts`, `search.spec.ts`).
 */

/**
 * Selectors excluded from every scan, with why. Each of these is a markup
 * gap in a VENDORED CivicTheme component (`src/civictheme/components/**`)
 * or its behaviour JS, reproduced faithfully from upstream twig/JS — the
 * markup-fidelity rule (shared-reference.md) forbids fixing it inside the
 * component, so it is recorded in PORTING.md instead and excluded here
 * rather than left as a permanently-failing assertion:
 *
 * - `.ct-link--disabled`: this is `Link.astro`'s class for ANY link
 *   rendered with `isDisabled` (`Link.astro:68`, `isDisabled &&
 *   'ct-link--disabled'`), not just `Pagination`'s prev/next — Pagination
 *   is simply the only current call site that passes `isDisabled`. Its
 *   colour is a WCAG 1.4.3 "inactive user interface component" — the
 *   success criterion explicitly exempts inactive-control text from the
 *   contrast-minimum requirement, an exemption axe's `color-contrast` rule
 *   cannot itself apply to a CSS-classed (not `disabled`-attribute)
 *   inactive link. The exemption only holds if the link is GENUINELY
 *   inactive, so every per-page test in `a11y.spec.ts` also asserts every
 *   `.ct-link--disabled` element has no `href` and is not focusable — a
 *   defective disabled link (still clickable/tabbable) must fail the run
 *   rather than hide behind this exclusion.
 * - `.ct-popover__link`: `Popover.astro`/`popover.twig` render the trigger
 *   as a plain `<a>` with no `href` (so no implicit interactive role), and
 *   `collapsible.js` sets `aria-expanded` on it regardless — axe
 *   `aria-allowed-attr` (`aria-expanded` isn't allowed on a roleless `<a>`).
 *   Upstream's own popover.twig never sets `role="button"` on this link.
 * - `.ct-tabs__links`: `tabs.twig`/`Tabs.astro` never puts `role="tablist"`
 *   on the generated links' `<ul>` wrapper. Every generated tab link
 *   (`role="tab"`, from the panels-only branch) then fails axe
 *   `aria-required-parent`; the `Tabs` molecule's OWN story
 *   (`molecules-tabs--tabs`) passes explicit `links` with no `role` at all
 *   (upstream's own fixture, `tabs.stories.js`), which — combined with
 *   `tabs.js` unconditionally setting `aria-selected` on the link — fails
 *   `aria-allowed-attr` instead. Both trace to the same upstream gap
 *   (`<ul>` never gets `role="tablist"`, so no fix at either end is
 *   independently correct).
 * - `.ct-tooltip__close-button`: `tooltip.twig`'s close button is a bare
 *   icon-only `@atoms/button` include with no `title`/label param at all —
 *   there is no prop path (component or demo) to give it an accessible
 *   name. Axe `button-name`.
 * - `.ct-tabs__panels__panel`: narrowed from the whole `.ct-tabs__panels`
 *   container to the exact violating node axe reports (target
 *   `#panel-1-Tabs-dark`, class `ct-tabs__panels__panel`, the individual
 *   panel `<div>` — the parent `.ct-tabs__panels` has no other content of
 *   its own to scan). `tabs.twig` prints `panel.content` (documented as
 *   plain `[string]`) directly, with no theme-scoped text colour on this
 *   element — unlike `.ct-basic-content`'s `ct-content-theme($theme)`,
 *   `tabs.scss` never themes panel text. `molecules-tabs--tabs`'s own
 *   upstream fixture (`Panel content`, no markup) reproduces this on a
 *   `theme: dark` story, so it isn't this project's page authoring at
 *   fault. Axe `color-contrast`.
 */
export const EXCLUDE_ALWAYS = [
  '.ct-link--disabled',
  '.ct-popover__link',
  '.ct-tabs__links',
  '.ct-tooltip__close-button',
  '.ct-tabs__panels__panel',
];
