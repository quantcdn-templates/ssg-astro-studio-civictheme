import { describe } from 'vitest';
import Search from '@civictheme/molecules/Search.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'search' };

const REQUIRED_KEY = 'Search Component renders with required attributes 1';
const OPTIONAL_KEY = 'Search Component renders with optional attributes 1';
const URL_ONLY_KEY = 'Search Component renders with URL only 1';

describe('Search', () => {
  parityCase(meta, REQUIRED_KEY, Search, {
    text: 'Search',
    url: 'https://example.com/search',
  });

  parityCase(meta, OPTIONAL_KEY, Search, {
    text: 'Search',
    url: 'https://example.com/search',
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, URL_ONLY_KEY, Search, {
    text: 'Search',
    url: 'https://example.com/search',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, URL_ONLY_KEY]);
});
