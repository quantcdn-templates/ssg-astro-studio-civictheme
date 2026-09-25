import { test, expect } from '@playwright/test';
import { demoPresent, demoHomePresent } from '../demo-content';

/**
 * Card images inside MDX pages.
 *
 * `PageLayout`/`DetailLayout` wrap the whole MDX body in `.page-content`,
 * whose prose rule gives every `img` a large vertical margin
 * (`scss/00-base/mixins/_content.scss`). That margin pushed NavigationCard's
 * absolutely positioned image down over the card title, and added a band
 * above and below PromoCard images. The `@scope` limit in
 * `src/styles/global.scss` keeps the prose rules off CivicTheme components;
 * bare Markdown images keep the margin.
 */
test('NavigationCard images sit at the top of their wrapper and clear the title', async ({ page }) => {
  test.skip(!demoPresent('src/content/pages/civictheme-60-second-series.mdx'), 'demo page removed by migration');
  await page.goto('/civictheme-60-second-series');
  const cards = await page.locator('.page-content .ct-navigation-card--with-image').evaluateAll((nodes) =>
    nodes.map((card) => {
      const box = (selector: string) => card.querySelector(selector)!.getBoundingClientRect().toJSON() as DOMRect;
      return {
        wrapper: box('.ct-navigation-card__image'),
        image: box('.ct-navigation-card__image img.ct-image'),
        title: box('.ct-navigation-card__title'),
      };
    })
  );
  expect(cards.length).toBeGreaterThan(0);

  cards.forEach(({ wrapper, image, title }, i) => {
    expect(Math.abs(image.top - wrapper.top), `card ${i}: image top equals wrapper top`).toBeLessThan(1);
    const overlaps =
      image.left < title.right && title.left < image.right && image.top < title.bottom && title.top < image.bottom;
    expect(overlaps, `card ${i}: image does not overlap the title`).toBe(false);
  });
});

test('PromoCard images inside basic content have no vertical margin', async ({ page }) => {
  test.skip(!demoHomePresent(), 'demo home page replaced by migration');
  await page.goto('/');
  const image = page.locator('.page-content .ct-promo-card__image img.ct-image').first();
  await expect(image).toBeVisible();
  const margins = await image.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.marginTop, style.marginBottom];
  });
  expect(margins).toEqual(['0px', '0px']);
});
