import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PageBanner from '../src/components/PageBanner.astro';

/**
 * A source hero's own call-to-action (olsc.nsw.gov.au's "Learn more") is a
 * CivicTheme button in the banner content, under the summary.
 */
async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(PageBanner, { props: { title: 'Office', ...props } });
}

describe('PageBanner button', () => {
  it('renders the button link in the banner content, after the summary', async () => {
    const html = await render({ summary: 'We handle complaints.', button: { text: 'Learn more', url: '/about-us' } });
    const content = html.slice(html.indexOf('ct-banner__content'));
    expect(content).toMatch(/We handle complaints\./);
    expect(content).toMatch(
      /<a[^>]+class="ct-button[^"]*"[^>]*href="\/about-us"|<a[^>]+href="\/about-us"[^>]*class="ct-button/
    );
    expect(content.indexOf('We handle complaints.')).toBeLessThan(content.indexOf('Learn more'));
  });

  it('renders the button when the banner has no summary', async () => {
    const html = await render({ button: { text: 'Learn more', url: '/about-us' } });
    expect(html).toContain('ct-banner__content');
    expect(html).toContain('Learn more');
  });

  it('renders no button without one', async () => {
    const html = await render({ summary: 'We handle complaints.' });
    expect(html).not.toContain('ct-button');
  });
});
