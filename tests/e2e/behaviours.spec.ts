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
 *   heading (table-of-contents.js:111-125/48-49) — there is no upstream "highlight the
 *   active link on scroll" logic on this component (that would be `scrollspy.js`, which
 *   only toggles a class on the element it is attached to, not on TOC links). The scroll-
 *   driven part of this test instead exercises `BackToTop`'s own `scrollspy.js` usage
 *   (`data-scrollspy`/`data-scrollspy-offset="400"`, `BackToTop.astro`): scrolling past
 *   400px adds `.ct-scrollspy-scrolled` to `[data-scrollspy]` (scrollspy.js:27-28).
 */
test.describe('CivicTheme behaviours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/behaviours');
  });

  test('accordion expands a panel', async ({ page }) => {
    const trigger = page.locator('[data-collapsible-trigger]').first();
    await trigger.click();
    await expect(page.locator('[data-collapsible]').first()).not.toHaveAttribute('data-collapsible-collapsed');
  });

  test('tabs switch panels', async ({ page }) => {
    const second = page.locator('[data-tabs-tab]').nth(1);
    await second.click();
    await expect(second).toHaveAttribute('aria-selected', 'true');
  });

  test('mobile navigation opens', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.locator('[data-flyout-open-trigger]').first().click();
    await expect(page.locator('[data-flyout]').first()).toHaveAttribute('data-flyout-expanded', 'true');
  });

  test('table of contents builds links and back-to-top highlights on scroll', async ({ page }) => {
    // table-of-contents.js builds the link list client-side from the three h2 sections.
    const tocLinks = page.locator('.ct-table-of-contents__links a.ct-table-of-contents__link');
    await expect(tocLinks).toHaveCount(3);
    await expect(tocLinks.nth(2)).toHaveAttribute('href', '#section-3');

    // scrollspy.js adds ct-scrollspy-scrolled to BackToTop's [data-scrollspy] element
    // once window.scrollY passes its data-scrollspy-offset (400).
    const backToTop = page.locator('[data-scrollspy]').first();
    await expect(backToTop).not.toHaveClass(/ct-scrollspy-scrolled/);
    await page.locator('#section-3').scrollIntoViewIfNeeded();
    await expect(backToTop).toHaveClass(/ct-scrollspy-scrolled/);
  });
});
