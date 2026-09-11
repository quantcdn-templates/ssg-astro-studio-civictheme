import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EXCLUDE_ALWAYS } from './axe-excludes';

/**
 * The demo forms against a stand-in for the Quant CDN.
 *
 * On Quant, a POST to a page with Quant Forms enabled returns the same page
 * with the configured message written after `id="quant-form-result">`
 * (quant `docker/fastly/src/filters.js`, `formSubmissionFilter`). The route
 * below does the same to the built page, with the message from
 * `forms/forms.json`, so these tests prove the built markup, the manifest
 * and the focus script fit that contract.
 */
type Entry = { route: string; config: Record<string, string> };
const manifest = JSON.parse(readFileSync('forms/forms.json', 'utf8')) as Entry[];

for (const entry of manifest) {
  test(`${entry.route}: posts to its own page and focuses the Quant Forms message`, async ({ page }) => {
    const posted: string[] = [];
    await page.route(`**${entry.route}`, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      posted.push(route.request().postData() ?? '');
      const response = await route.fetch({ method: 'GET', postData: undefined });
      const message = `<div class='quant-form-success'>${entry.config.success_message}</div>`;
      const body = (await response.text()).replace(
        /id\s*=\s*(?:"quant-form-result"|'quant-form-result'|quant-form-result)\s*>/gi,
        `id="quant-form-result">${message}`
      );
      await route.fulfill({ status: 200, contentType: 'text/html', body });
    });

    await page.goto(entry.route);
    const form = page.locator('form.ct-webform__form');
    await form.locator('input[name="name"]').fill('Jo Citizen');
    await form.locator('input[name="email"]').fill('jo@example.com');
    await form.locator('textarea[name="message"]').fill('Hello');
    await form.locator('[type="submit"]').click();

    const result = page.locator('#quant-form-result');
    await expect(result.locator('.ct-message--success')).toBeVisible();
    await expect(result).toBeFocused();
    const fields = new URLSearchParams(posted[0]);
    expect(fields.get('email')).toBe('jo@example.com');
    expect(fields.get('website')).toBe('');

    let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
    for (const selector of EXCLUDE_ALWAYS) builder = builder.exclude(selector);
    const { violations } = await builder.analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
}
