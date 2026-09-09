import { describe, it, expect } from 'vitest';
import List from '@civictheme/organisms/List.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'list' };

const ALL_KEY = 'List Component renders with all attributes provided 1';
const MISSING_KEY = 'List Component renders with some attributes missing 1';

describe('List', () => {
  parityCase(meta, ALL_KEY, List, {
    title: 'Sample Title',
    linkAbove: { text: 'Link Above', url: 'https://example.com', isNewWindow: false, isExternal: false },
    filters: 'Sample Filters',
    resultsCount: '10 Results',
    rowsAbove: 'Rows Above',
    rows: 'Rows Content',
    rowsBelow: 'Rows Below',
    empty: '',
    pagination: 'Pagination Content',
    footer: 'Footer Content',
    linkBelow: { text: 'Link Below', url: 'https://example.com', isNewWindow: false, isExternal: false },
    theme: 'dark',
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'additional-class',
  });

  parityCase(meta, MISSING_KEY, List, {
    title: '',
    linkAbove: null,
    filters: '',
    resultsCount: '',
    rowsAbove: '',
    rows: '',
    rowsBelow: '',
    empty: 'No results found',
    pagination: '',
    footer: '',
    linkBelow: null,
    theme: 'light',
    verticalSpacing: '',
    withBackground: false,
    class: '',
  });

  expectAllKeysCovered(meta, [ALL_KEY, MISSING_KEY]);

  // list.twig:139,163 — `{% if rows_above -%}` / `{% if rows_below %}` gate
  // on the raw prop's own truthiness (an array is truthy in Twig whenever
  // non-empty), not on the joined HTML string — not exercised by any
  // upstream snapshot, so tested directly.
  it('opens the rows-above container for a non-empty array of empty-string rows', async () => {
    const html = await renderNormalised(List, { rows: 'Rows Content', rowsAbove: ['', ''] });
    expect(html).toContain('ct-list__rows-above');
  });

  it('does not open the rows-above container for an empty array', async () => {
    const html = await renderNormalised(List, { rows: 'Rows Content', rowsAbove: [] });
    expect(html).not.toContain('ct-list__rows-above');
  });

  // Task 14b: every Slot-documented prop now has a same-named Astro slot
  // that takes precedence over the string prop. Passing the same content
  // via the slot instead of the string prop must render identically.
  describe('slot vs string-prop parity', () => {
    it('rows: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(List, { rows: 'Rows Content' });
      const viaSlot = await renderNormalised(List, {}, { rows: 'Rows Content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('filters: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(List, { rows: 'Rows Content', filters: 'Sample Filters' });
      const viaSlot = await renderNormalised(List, { rows: 'Rows Content' }, { filters: 'Sample Filters' });
      expect(viaSlot).toBe(viaProp);
    });

    it('pagination: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(List, { rows: 'Rows Content', pagination: 'Pagination Content' });
      const viaSlot = await renderNormalised(List, { rows: 'Rows Content' }, { pagination: 'Pagination Content' });
      expect(viaSlot).toBe(viaProp);
    });

    // `title`/`content`/`empty` route their string prop through a
    // sub-component (`Heading`/`Paragraph`) that adds its own wrapper
    // markup — the slot renders the caller's markup directly (no such
    // wrapper), so parity is checked against the sub-component's own
    // known output, not against the raw string.
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(List, { rows: 'Rows Content', title: 'Sample Title' });
      const viaSlot = await renderNormalised(
        List,
        { rows: 'Rows Content' },
        { title: '<h2 class="ct-heading ct-list__title ct-theme-light">Sample Title</h2>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('content: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(List, { rows: 'Rows Content', content: 'Sample Content' });
      const viaSlot = await renderNormalised(
        List,
        { rows: 'Rows Content' },
        {
          content:
            '<div class="ct-list__content__inner ct-paragraph ct-paragraph--regular ct-theme-light">Sample Content</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('resultsCount: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(List, { rows: 'Rows Content', resultsCount: '10 Results' });
      const viaSlot = await renderNormalised(List, { rows: 'Rows Content' }, { resultsCount: '10 Results' });
      expect(viaSlot).toBe(viaProp);
    });

    it('footer: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(List, { rows: 'Rows Content', footer: 'Footer Content' });
      const viaSlot = await renderNormalised(List, { rows: 'Rows Content' }, { footer: 'Footer Content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('empty: slot renders identically to the string prop (no rows)', async () => {
      const viaProp = await renderNormalised(List, { empty: 'No results found' });
      const viaSlot = await renderNormalised(
        List,
        {},
        {
          empty:
            '<div class="ct-list__empty-results__inner ct-paragraph ct-paragraph--regular ct-theme-light">No results found</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(List, {}, { rows: 'Live Rows' });
      expect(html).toContain('ct-list__rows');
      expect(html).toContain('Live Rows');
    });
  });
});
