import { test, expect } from '@playwright/test';

/**
 * Mobile cell labels for Markdown tables in the page body.
 *
 * On narrow screens, the CivicTheme table styles stack the body cells and show
 * each column name from `data-title`. The vendored `behaviours/table.js` labels
 * only `.ct-basic-content table, .ct-table`, so a Markdown table in
 * `.page-content` needs `src/lib/page-content-tables.ts` (called from the
 * BaseLayout script).
 *
 * No demo page has a Markdown table, so the test adds one to the served
 * /about-us HTML before the page scripts run. The markup is the GFM table
 * shape that MDX renders: a `thead` row of `th` cells and `tbody` rows of `td`
 * cells, with no class.
 */
const MARKDOWN_TABLE = [
  '<table>',
  '<thead><tr><th>Service</th><th>Hours</th></tr></thead>',
  '<tbody>',
  '<tr><td>Library</td><td>9am to 5pm</td></tr>',
  '<tr><td>Pool</td><td>6am to 8pm</td></tr>',
  '</tbody>',
  '</table>',
].join('');

test('a Markdown table in the page body gets mobile cell labels', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.route('**/about-us', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /(<div class="page-content[^"]*">)/,
      `$1<h2>Opening hours</h2>${MARKDOWN_TABLE}`
    );
    await route.fulfill({ response, body: html });
  });

  await page.goto('/about-us');
  const table = page.locator('.page-content > table').first();
  await expect(table).toBeVisible();

  const cells = await table.locator('tbody td').evaluateAll((nodes) =>
    nodes.map((node) => ({
      title: node.getAttribute('data-title'),
      label: getComputedStyle(node, '::before').content,
    }))
  );
  expect(cells).toEqual([
    { title: 'Service', label: '"Service"' },
    { title: 'Hours', label: '"Hours"' },
    { title: 'Service', label: '"Service"' },
    { title: 'Hours', label: '"Hours"' },
  ]);
});
