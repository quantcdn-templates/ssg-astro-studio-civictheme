import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EXCLUDE_ALWAYS } from './axe-excludes';

/**
 * The native `/search` page (`src/pages/search.astro`) against a mocked
 * Quant AI Search endpoint.
 *
 * The e2e build has no `PUBLIC_QUANT_SEARCH_SITE_ID`, so the page ships in
 * its "not set up" state. The configured states rewrite the served HTML's
 * one build-time value — the empty `data-site-id` on the `[data-quant-search]`
 * root — and leave every other byte as built, so the client script's own
 * configuration check decides what shows. The API origin is the template
 * default, `https://ai-search.quantcdn.io`.
 */
const SEARCH_API = 'https://ai-search.quantcdn.io/v1/public/sites/*/search';
const SITE_ID = 'e2e-site';

const fixture = {
  results: [
    {
      url: '/news/new-library-hours',
      title: 'New library hours',
      snippet: 'The library opens earlier.',
      metadata: { summary: 'Longer opening hours from March.' },
      score: 0.91,
    },
    {
      url: '/events/open-day',
      title: 'Open day <img src=x onerror="window.__xss=1">',
      snippet: 'Tour the <b>council</b> chambers.',
      score: 0.72,
    },
  ],
};

const cors = { 'access-control-allow-origin': '*' };

async function withSiteId(page: Page): Promise<void> {
  await page.route('**/search?q=*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const response = await route.fetch();
    // Astro renders an empty attribute value as a bare `data-site-id`.
    const body = (await response.text()).replace(/data-site-id(="")?(?=[\s>])/, `data-site-id="${SITE_ID}"`);
    await route.fulfill({ response, body });
  });
}

async function mockApi(page: Page, reply: { status?: number; json: unknown }): Promise<string[]> {
  const bodies: string[] = [];
  await page.route(SEARCH_API, async (route) => {
    bodies.push(route.request().postData() ?? '');
    await route.fulfill({ status: reply.status ?? 200, headers: cors, json: reply.json });
  });
  return bodies;
}

async function expectNoAxeViolations(page: Page): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  for (const selector of EXCLUDE_ALWAYS) builder = builder.exclude(selector);
  const { violations } = await builder.analyze();
  const summary = violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  expect(violations, JSON.stringify(summary, null, 2)).toEqual([]);
}

test.describe('native search page', () => {
  test('not configured: no request, the Callout shows and the form still works', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/v1/public/sites/')) requests.push(request.url());
    });
    const response = await page.goto('/search?q=library');
    expect(response!.status()).toBe(200);

    await expect(page.getByText('Search is not set up for this site yet.')).toBeVisible();
    await expect(page.locator('[data-search-ui]')).toBeHidden();
    await expect(page.locator('form[role="search"] input[name="q"]')).toBeVisible();
    expect(requests).toEqual([]);
    await expectNoAxeViolations(page);
  });

  test('results: renders Snippets, announces the count and focuses the heading', async ({ page }) => {
    await withSiteId(page);
    const bodies = await mockApi(page, { json: fixture });
    await page.goto('/search?q=library');

    const status = page.locator('[data-search-status]');
    await expect(status).toHaveText('Showing 2 results for “library”');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(page.getByText('Search is not set up for this site yet.')).toBeHidden();

    const links = page.locator('[data-search-rows] .ct-snippet__title-link');
    await expect(links).toHaveCount(2);
    await expect(links.first()).toHaveAttribute('href', '/news/new-library-hours');
    await expect(links.nth(1)).toHaveText('Open day');
    await expect(page.locator('[data-search-rows] img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined();

    await expect(page.locator('[data-search-heading]')).toBeFocused();
    await expect(page.locator('input[name="q"]')).toHaveValue('library');
    expect(JSON.parse(bodies[0]!)).toEqual({ query: 'library', limit: 10 });
    await expectNoAxeViolations(page);
  });

  test('empty: shows "No results for …"', async ({ page }) => {
    await withSiteId(page);
    await mockApi(page, { json: { results: [] } });
    await page.goto('/search?q=zzzz');

    await expect(page.locator('[data-search-status]')).toHaveText('No results for “zzzz”');
    await expect(page.locator('[data-search-results]')).toBeHidden();
    await expect(page.locator('[data-search-error]')).toBeHidden();
    await expectNoAxeViolations(page);
  });

  test('error: shows the CivicTheme error message', async ({ page }) => {
    await withSiteId(page);
    await mockApi(page, { status: 500, json: { error: 'Search failed' } });
    await page.goto('/search?q=library');

    await expect(page.locator('[data-search-status]')).toHaveText('Search failed.');
    await expect(page.locator('[data-search-error]')).toBeVisible();
    await expect(page.locator('[data-search-results]')).toBeHidden();
    await expectNoAxeViolations(page);
  });
});
