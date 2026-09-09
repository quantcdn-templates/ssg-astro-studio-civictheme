import { describe, it, expect } from 'vitest';
import InlineFilter from '@civictheme/molecules/InlineFilter.astro';
import { renderNormalised } from '../harness';

// InlineFilter has no upstream `.test.js` / `__snapshots__` in
// .upstream/uikit/packages/twig/components/02-molecules/inline-filter (only
// .scss/.stories.* files exist there) — smoke test per the task brief's rule
// for components with no upstream test, matching TextIcon's precedent.
describe('InlineFilter (smoke — no upstream test.js)', () => {
  it('renders nothing meaningful when no items/itemsEnd slots are given', async () => {
    const html = await renderNormalised(InlineFilter, {});
    expect(html).toBe(
      '<div class="ct-inline-filter ct-theme-light"><div class="ct-inline-filter__content"></div></div>'
    );
  });

  it('renders the title, items slot, and submit button when items is given', async () => {
    const html = await renderNormalised(InlineFilter, { title: 'Filter results' }, { items: '<span>field</span>' });
    expect(html).toContain('ct-inline-filter__title');
    expect(html).toContain('Filter results');
    expect(html).toContain('<span>field</span>');
    expect(html).toContain('ct-inline-filter__submit-button');
    expect(html).toContain('type="submit"');
    expect(html).toContain('ct-button--primary');
    expect(html).toContain('Search');
  });

  it('renders custom submitText and the itemsEnd slot', async () => {
    const html = await renderNormalised(
      InlineFilter,
      { submitText: 'Go' },
      { items: '<span>field</span>', itemsEnd: '<span>end</span>' }
    );
    expect(html).toContain('Go');
    expect(html).toContain('ct-inline-filter__items-end');
    expect(html).toContain('<span>end</span>');
  });

  it('supports theme, class, and rest-spread attributes', async () => {
    const html = await renderNormalised(InlineFilter, {
      theme: 'dark',
      class: 'custom-class',
      'data-test': 'true',
    });
    expect(html).toContain('ct-theme-dark');
    expect(html).toContain('custom-class');
    expect(html).toContain('data-test="true"');
  });
});
