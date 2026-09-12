/**
 * Iframe is exposed to MDX editors, so its `url` and extra attributes are
 * untrusted: only https URLs reach `src`, and the attribute spread cannot add
 * event handlers or replace the frame's document.
 */
import { describe, it, expect } from 'vitest';
import Iframe from '@civictheme/atoms/Iframe.astro';
import { renderComponent } from './parity/harness';

function iframeTag(html: string): string {
  const match = html.match(/<iframe\b[^>]*>/);
  if (!match) throw new Error(`no <iframe> in: ${html}`);
  return match[0];
}

describe('Iframe url', () => {
  it('renders an https url as src', async () => {
    const tag = iframeTag(await renderComponent(Iframe, { url: 'https://example.com/embed?a=1' }));
    expect(tag).toContain('src="https://example.com/embed?a=1"');
  });

  it.each([
    ['http', 'http://example.com'],
    ['javascript', 'javascript:alert(1)'],
    ['javascript with padding and mixed case', '  JavaScript:alert(1)'],
    ['javascript with an embedded tab', 'java\tscript:alert(1)'],
    ['data', 'data:text/html,<script>alert(1)</script>'],
    ['protocol-relative', '//evil.example/embed'],
    ['relative path', '/embed'],
    ['unparseable', 'https://'],
    ['empty', ''],
  ])('renders no src for a %s url', async (_label, url) => {
    const tag = iframeTag(await renderComponent(Iframe, { url }));
    expect(tag).not.toMatch(/\ssrc=/);
  });

  it('renders no src when url is not a string', async () => {
    const tag = iframeTag(await renderComponent(Iframe, { url: { toString: () => 'javascript:alert(1)' } }));
    expect(tag).not.toMatch(/\ssrc=/);
  });
});

describe('Iframe attribute spread', () => {
  it('drops event handler attributes in any case', async () => {
    const tag = iframeTag(
      await renderComponent(Iframe, {
        url: 'https://example.com',
        onload: 'alert(1)',
        onError: 'alert(2)',
        ONMOUSEOVER: 'alert(3)',
      })
    );
    expect(tag).not.toMatch(/\son[a-z]*=/i);
  });

  it('does not let src or srcdoc override the checked url', async () => {
    const tag = iframeTag(
      await renderComponent(Iframe, {
        url: 'https://example.com',
        src: 'javascript:alert(1)',
        SRCDOC: '<script>alert(1)</script>',
      })
    );
    expect(tag).toContain('src="https://example.com"');
    expect(tag).not.toMatch(/javascript:|srcdoc=/i);
  });

  it('still passes other attributes through', async () => {
    const tag = iframeTag(
      await renderComponent(Iframe, {
        url: 'https://example.com',
        title: 'Map',
        allow: 'fullscreen',
        'data-test': 'true',
      })
    );
    expect(tag).toContain('title="Map"');
    expect(tag).toContain('allow="fullscreen"');
    expect(tag).toContain('data-test="true"');
  });
});
