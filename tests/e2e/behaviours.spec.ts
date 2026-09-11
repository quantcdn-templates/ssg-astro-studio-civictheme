import { test, expect } from '@playwright/test';

/**
 * CivicTheme behaviour smoke tests, against `src/pages/components/behaviours.astro`
 * (built + previewed by the `webServer` in `playwright.config.ts`).
 *
 * Selectors below are taken from what each vendored behaviour actually reads/sets on
 * the DOM (`src/civictheme/js/behaviours/*.js`), not from illustrative guesses:
 *
 * - Accordion (`collapsible.js`): the trigger is found via `[data-collapsible-trigger]`
 *   (set on the `<button>` — collapsible.js:41-42/415); clicking it dispatches
 *   `ct.collapsible.expand`/`collapse` (collapsible.js:175-178), whose handlers remove/
 *   add `data-collapsible-collapsed` on the `[data-collapsible]` element itself
 *   (collapsible.js:265-266/347-348).
 *
 * - Tabs (`tabs.js`): tab links are found via `[data-tabs-tab]`, NOT a `.ct-tabs__tab`
 *   class — `this.links = this.el.querySelectorAll('[data-tabs-tab]')` (tabs.js:11);
 *   `Tabs.astro` puts `data-tabs-tab=""` on the generated `Link`, which otherwise only
 *   carries `ct-link`/`ct-theme-*` classes (no `ct-tabs__tab` class exists in the real
 *   markup). Clicking a tab link sets `aria-selected` on it directly (tabs.js:50).
 *
 * - Mobile navigation (`flyout.js`): the open trigger is `[data-flyout-open-trigger]`
 *   (flyout.js:18, `MobileNavigationTrigger.astro`'s `Button`); the panel is
 *   `[data-flyout]` (flyout.js:204, `MobileNavigation.astro`'s root `<div>`). Expanding
 *   sets `data-flyout-expanded="true"` on that root element — `setAttribute(...,
 *   true)`, not an empty string (flyout.js:162).
 *
 * - Table of contents (`table-of-contents.js`): self-inits on
 *   `[data-table-of-contents-position]` (table-of-contents.js:150) and, finding headings
 *   via `anchorSelector`/`anchorScopeSelector` (defaults `h2`/`.ct-basic-content`,
 *   table-of-contents.js:15-16), inserts a `.ct-table-of-contents` block containing
 *   `.ct-table-of-contents__links > .ct-table-of-contents__link-item > a` — one per
 *   heading (table-of-contents.js:111-125/48-49). This component has no "highlight the
 *   active link on scroll" logic of its own — the last test's name and assertions
 *   reflect that: it checks the TOC's links are built from the headings, and separately
 *   checks `BackToTop`'s own `scrollspy.js` usage (`data-scrollspy`/
 *   `data-scrollspy-offset="400"`, `BackToTop.astro`) — scrolling past 400px adds
 *   `.ct-scrollspy-scrolled` to `[data-scrollspy]` (scrollspy.js:27-28) — since that is
 *   the only actual scroll-driven class toggle anywhere on this page.
 */
test.describe('CivicTheme site alerts', () => {
  // `SiteAlerts.astro` wraps the build-time alerts in the
  // `[data-component-name="ct-alerts"]` container `alert.js` expects, and the
  // shim in `src/civictheme/js/civictheme.js` attaches the dismiss listener
  // that `alert.js` itself only attaches to fetched alerts (alert.js:212).
  test('site alert dismisses on click', async ({ page }) => {
    await page.goto('/');
    const alert = page.locator('[data-component-name="ct-alerts"] [data-component-name="ct-alert"]').first();
    await expect(alert).toBeVisible();
    await alert.locator('[data-alert-dismiss-trigger]').click();
    await expect(alert).toHaveCount(0);
  });

  // The inline head script in `BaseLayout.astro` hides cookie-dismissed
  // alerts before paint. With the module script blocked, only that inline
  // script can be hiding the alert.
  test('a dismissed alert stays hidden on the next page without the module script', async ({ page }) => {
    await page.goto('/');
    const alert = page.locator('[data-component-name="ct-alerts"] [data-component-name="ct-alert"]').first();
    await alert.locator('[data-alert-dismiss-trigger]').click();
    await expect(alert).toHaveCount(0);

    await page.route('**/_astro/*.js', (route) => route.abort());
    await page.goto('/about-us');
    await expect(alert).toHaveCount(1);
    await expect(alert).toBeHidden();
  });

  test('an alert whose content changed since its dismissal shows again', async ({ page, context }) => {
    await page.goto('/');
    const alert = page.locator('[data-component-name="ct-alerts"] [data-component-name="ct-alert"]').first();
    const id = await alert.getAttribute('data-alert-id');
    // A hash that matches no current markup: the alert was dismissed, then edited.
    await context.addCookies([
      { name: 'ct-alert-hide', value: JSON.stringify({ [id!]: 1 }), url: page.url(), sameSite: 'Strict' },
    ]);
    await page.goto('/about-us');
    await expect(alert).toBeVisible();
    await expect(page.locator('#ct-alert-prehide')).toHaveCount(0);
  });
});

test.describe('CivicTheme behaviours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/behaviours');
  });

  test('accordion expands a panel', async ({ page }) => {
    // Scoped to the accordion: BaseLayout's site header also renders collapsible
    // elements (drawer navigation, mobile navigation) on every page.
    const trigger = page.locator('.ct-accordion [data-collapsible-trigger]').first();
    await trigger.click();
    await expect(page.locator('.ct-accordion [data-collapsible]').first()).not.toHaveAttribute(
      'data-collapsible-collapsed'
    );
  });

  test('tabs switch panels', async ({ page }) => {
    const second = page.locator('[data-tabs-tab]').nth(1);
    await second.click();
    await expect(second).toHaveAttribute('aria-selected', 'true');
  });

  test('mobile navigation opens', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    // The pair under test is the site header's (BaseLayout): the trigger's
    // `data-flyout-target` is the global selector `.ct-mobile-navigation`, so
    // only one mobile navigation per page can ever be driven.
    await page.locator('[data-flyout-open-trigger]').first().click();
    await expect(page.locator('[data-flyout]').first()).toHaveAttribute('data-flyout-expanded', 'true');
  });

  test('table of contents builds links from headings; back-to-top gains scrollspy class on scroll', async ({
    page,
  }) => {
    // table-of-contents.js builds the link list client-side from the three h2 sections.
    const tocLinks = page.locator('.ct-table-of-contents__links a.ct-table-of-contents__link');
    await expect(tocLinks).toHaveCount(3);
    await expect(tocLinks.nth(2)).toHaveAttribute('href', '#section-3');

    // scrollspy.js adds ct-scrollspy-scrolled to BackToTop's [data-scrollspy] element
    // once window.scrollY passes its data-scrollspy-offset (400).
    // BackToTop now comes from BaseLayout, once per page.
    const backToTop = page.locator('[data-scrollspy]').first();
    await expect(backToTop).not.toHaveClass(/ct-scrollspy-scrolled/);
    await page.locator('#section-3').scrollIntoViewIfNeeded();
    await expect(backToTop).toHaveClass(/ct-scrollspy-scrolled/);
  });
});
