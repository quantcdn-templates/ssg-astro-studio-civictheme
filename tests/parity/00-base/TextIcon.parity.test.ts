import { describe, it, expect } from 'vitest';
import TextIcon from '@civictheme/base/TextIcon.astro';
import Icon from '@civictheme/base/Icon.astro';
import { renderNormalised, normaliseHtml } from '../harness';

// TextIcon has no upstream `.test.js` / `__snapshots__` in
// .upstream/uikit/packages/twig/components/00-base/text-icon — smoke test
// asserting the root class, per the task brief's rule for components with no
// upstream test.
describe('TextIcon (smoke — no upstream test.js)', () => {
  it('renders a span.ct-text-icon__text for plain text with no icon', async () => {
    const html = await renderNormalised(TextIcon, { text: 'Home' });
    expect(html).toBe('<span class="ct-text-icon__text">Home</span>');
  });

  it('renders nothing meaningful for empty text and no icon', async () => {
    const html = await renderNormalised(TextIcon, {});
    expect(html).toBe('<span class="ct-text-icon__text"></span>');
  });

  it('renders an icon before the text when iconPlacement is "before"', async () => {
    const html = await renderNormalised(TextIcon, { text: 'Close', icon: 'close', iconPlacement: 'before' });
    expect(html).toContain('ct-icon');
    expect(html).toContain('ct-text-icon__text');
  });

  // text-icon.twig:53 — `{%- if show_full_text %} {% endif -%}` — a literal
  // space always separates the full text from whatever trailing icons
  // follow it, even though it is not visible in the Twig source's own
  // whitespace control.
  it('separates the full text span from a trailing icon with a space when showFullText is true', async () => {
    const iconHtml = await renderNormalised(Icon, { symbol: 'close' });
    const html = await renderNormalised(TextIcon, {
      text: 'Close All',
      icon: 'close',
      iconPlacement: 'after',
      iconGroupDisabled: true,
    });
    expect(html).toBe(normaliseHtml(`<span class="ct-text-icon__text">Close All</span> ${iconHtml}`));
  });
});
