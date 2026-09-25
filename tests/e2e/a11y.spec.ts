import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EXCLUDE_ALWAYS } from './axe-excludes';
import { demoPresent } from '../demo-content';

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
  // No trailing slash: `astro.config.mjs` sets `trailingSlash: 'never'`, so
  // `/components/` is not a served address.
  '/components',
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

// `/accessibility` is a built public route — authored as
// `src/content/pages/accessibility.mdx` and rendered by the
// `src/pages/[...slug].astro` catch-all (`dist/accessibility/index.html`),
// same as the other reference pages above.
const otherPages = ['/accessibility', '/search', '/404.html'];

const pages = [...referencePages, ...componentPages, ...listingAndDetailPages, ...otherPages];

/**
 * Pages above that are demo content a Studio migration deletes, mapped to
 * the repo-relative file whose presence proves it — everything in
 * `referencePages` except the home page (which stays present after
 * migration, just with different content), `/accessibility`, and the three
 * demo detail pages in `listingAndDetailPages`. The listing pages
 * themselves (`/events`, `/news`, `/publications`), `/`, `/search`,
 * `/404.html` and every `/components/*` page are generic — they exist,
 * and must stay accessible, whatever content is in the collections.
 */
const demoContentPage: Record<string, string> = {
  '/about-us': 'src/content/pages/about-us.mdx',
  '/contact-us': 'src/content/pages/contact-us.mdx',
  '/individuals': 'src/content/pages/individuals.mdx',
  '/businesses': 'src/content/pages/businesses.mdx',
  '/government': 'src/content/pages/government.mdx',
  '/community-engagement': 'src/content/pages/community-engagement.mdx',
  '/news-and-events': 'src/content/pages/news-and-events.mdx',
  '/subscribe': 'src/content/pages/subscribe.mdx',
  '/civictheme-60-second-series': 'src/content/pages/civictheme-60-second-series.mdx',
  '/accessibility': 'src/content/pages/accessibility.mdx',
  '/events/open-day': 'src/content/events/open-day.mdx',
  '/news/budget-2026-adopted': 'src/content/news/budget-2026-adopted.mdx',
  '/publications/annual-report-2025': 'src/content/publications/annual-report-2025.mdx',
};

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
    const demoFile = demoContentPage[path];
    test.skip(demoFile !== undefined && !demoPresent(demoFile), 'demo content removed by migration');

    // A 404/500 still renders a page axe can scan cleanly, so assert the
    // route actually exists before trusting a "no violations" result.
    const response = await page.goto(path);
    expect(response!.status(), `expected 200 for ${path}`).toBe(200);
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
