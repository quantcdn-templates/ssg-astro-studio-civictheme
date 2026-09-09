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
});
