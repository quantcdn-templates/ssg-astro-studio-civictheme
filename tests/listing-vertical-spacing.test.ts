import { describe, it, expect } from 'vitest';
import ListingAuto from '../src/components/ListingAuto.astro';
import ListingGrid from '../src/components/ListingGrid.astro';
import { renderComponent } from './parity/harness';

describe('ListingGrid verticalSpacing', () => {
  it('passes verticalSpacing through to List', async () => {
    const html = await renderComponent(ListingGrid, { collection: 'news', entries: [], verticalSpacing: 'both' });
    expect(html).toMatch(/class="ct-list [^"]*ct-vertical-spacing-inset--both/);
  });

  it('adds no spacing class by default', async () => {
    const html = await renderComponent(ListingGrid, { collection: 'news', entries: [] });
    expect(html).not.toContain('ct-vertical-spacing-inset');
  });
});

describe('ListingAuto verticalSpacing', () => {
  it('passes verticalSpacing through ListingGrid to List', async () => {
    const html = await renderComponent(ListingAuto, { collection: 'news', entries: [], verticalSpacing: 'top' });
    expect(html).toMatch(/class="ct-list [^"]*ct-vertical-spacing-inset--top/);
  });
});
