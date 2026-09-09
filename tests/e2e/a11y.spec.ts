import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility pass (Task 18): axe-core over the reference pages and every
 * `/components/<family>` demo page.
 *
 * Zero serious/critical `wcag2a`/`wcag2aa` violations is the exit criterion.
 * Moderate/minor violations are collected across every page and written to
 * `test-results/a11y-moderate-minor.json` (also attached to the last test's
 * report) so the "currently zero" claim is a checked artefact, not prose:
 * the final test asserts the total equals `DOCUMENTED_MODERATE_MINOR_COUNT`,
 * which must match the row count of PORTING.md's "Accessibility (Task 18)"
 * moderate/minor table.
 *
 * A violation that originates in vendored (upstream) CivicTheme markup is
 * NOT fixed inside `src/civictheme/components/**` (markup-fidelity rule) —
 * it is recorded in `PORTING.md` with the axe rule id, and fixed at the call
 * site (page/layout/demo args) where that is possible.
 */
const referencePages = [
  '/',
  '/about-us',
  '/contact-us',
  '/individuals',
  '/businesses',
  '/government',
  '/community-engagement',
  '/news-and-events',
  '/subscribe',
  '/civictheme-60-second-series',
];

// Every route under `/components/` — the ten families named in the task
// brief plus the remaining ones so the whole section is covered.
const componentPages = [
  '/components/',
  '/components/banners',
  '/components/promo',
  '/components/campaign',
  '/components/callout',
  '/components/next-step',
  '/components/cards',
  '/components/lists',
  '/components/slider',
  '/components/accordion',
  '/components/tabs',
  '/components/table',
  '/components/forms',
  '/components/navigation',
  '/components/footer',
  '/components/alerts',
  '/components/base',
  '/components/behaviours',
];

const listingAndDetailPages = [
  '/events',
  '/events/open-day',
  '/news',
  '/news/budget-2026-adopted',
  '/publications',
  '/publications/annual-report-2025',
];

// `/accessibility` is a built public route (`src/pages/accessibility.astro` /
// `dist/accessibility.html`), same as the other reference pages above.
const otherPages = ['/accessibility', '/search', '/404.html'];

const pages = [...referencePages, ...componentPages, ...listingAndDetailPages, ...otherPages];

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
 *   inactive, so every per-page test below also asserts every
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
const EXCLUDE_ALWAYS = [
  '.ct-link--disabled',
  '.ct-popover__link',
  '.ct-tabs__links',
  '.ct-tooltip__close-button',
  '.ct-tabs__panels__panel',
];

/**
 * Per-page extra excludes, with why:
 *
 * - `/components/base`: the Video player demo embeds a REAL YouTube iframe
 *   (`.ct-video-player__wrapper iframe`) and a `rawSource` YouTube iframe —
 *   axe walks into that cross-origin frame and reports YouTube's own
 *   internal player markup (`ytmVideoInfo*`, `html5-video-player`, …),
 *   which this project neither renders nor controls. Excluded from the
 *   scan rather than "fixed"; recorded in PORTING.md.
 */
const EXTRA_EXCLUDES: Record<string, string[]> = {
  '/components/base': ['.ct-video-player__wrapper iframe'],
};

/** Row count of PORTING.md's "Accessibility (Task 18)" moderate/minor table. */
const DOCUMENTED_MODERATE_MINOR_COUNT = 0;

type ModerateMinorEntry = { id: string; impact: string | null | undefined; nodes: number; help: string };
const moderateMinorByPage: Record<string, ModerateMinorEntry[]> = {};

test.describe.configure({ mode: 'serial' });

for (const path of pages) {
  test(`no serious/critical axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
    for (const selector of [...EXCLUDE_ALWAYS, ...(EXTRA_EXCLUDES[path] ?? [])]) {
      builder = builder.exclude(selector);
    }
    const results = await builder.analyze();

    moderateMinorByPage[path] = results.violations
      .filter((v) => v.impact === 'moderate' || v.impact === 'minor')
      .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));

    const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      bad,
      JSON.stringify(
        bad.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.help })),
        null,
        2
      )
    ).toEqual([]);

    // Guard for the `.ct-link--disabled` exclusion above: the WCAG 1.4.3
    // exemption only covers a GENUINELY inactive control. Every disabled
    // link must have no `href` and must not be reachable by keyboard.
    const disabledLinks = page.locator('.ct-link--disabled');
    const disabledCount = await disabledLinks.count();
    for (let i = 0; i < disabledCount; i += 1) {
      const link = disabledLinks.nth(i);
      await expect(link, `.ct-link--disabled must not carry an href (${path})`).not.toHaveAttribute('href');
      // `.tabIndex` alone isn't reliable here — Chromium's IDL getter
      // reports 0 for a bare `<a>` even without an `href` (it does NOT
      // mean the element is in the Tab order). Check real focusability
      // instead: an anchor with no `href`/`tabindex` cannot receive focus.
      const becameFocused = await link.evaluate((el) => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        (el as HTMLElement).focus();
        const focused = document.activeElement === el;
        previouslyFocused?.focus();
        return focused;
      });
      expect(becameFocused, `.ct-link--disabled must not be keyboard-focusable (${path})`).toBe(false);
    }
  });
}

test('moderate/minor axe violations match PORTING.md', async ({}, testInfo) => {
  const report = JSON.stringify(moderateMinorByPage, null, 2);
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/a11y-moderate-minor.json', report);
  await testInfo.attach('a11y-moderate-minor.json', { body: report, contentType: 'application/json' });

  const total = Object.values(moderateMinorByPage).reduce((sum, entries) => sum + entries.length, 0);
  expect(total, report).toBe(DOCUMENTED_MODERATE_MINOR_COUNT);
});
