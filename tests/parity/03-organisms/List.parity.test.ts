import { describe } from 'vitest';
import List from '@civictheme/organisms/List.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

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
});
