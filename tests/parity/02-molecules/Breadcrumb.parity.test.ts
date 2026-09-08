import { describe } from 'vitest';
import Breadcrumb from '@civictheme/molecules/Breadcrumb.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'breadcrumb' };

const REQUIRED_KEY = 'Breadcrumb Component renders with required attributes 1';
const OPTIONAL_KEY = 'Breadcrumb Component renders with optional attributes 1';
const EMPTY_KEY = 'Breadcrumb Component renders without links 1';
const SPAN_KEY = 'Breadcrumb Component renders active element as span when active_is_link is false 1';

const links3 = [
  { text: 'Home', url: '/' },
  { text: 'Category', url: '/category' },
  { text: 'Subcategory', url: '/category/subcategory' },
];

describe('Breadcrumb', () => {
  parityCase(meta, REQUIRED_KEY, Breadcrumb, {
    links: links3,
  });

  parityCase(meta, OPTIONAL_KEY, Breadcrumb, {
    links: links3,
    theme: 'dark',
    activeIsLink: true,
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Breadcrumb, {
    links: [],
  });

  parityCase(meta, SPAN_KEY, Breadcrumb, {
    links: links3,
    activeIsLink: false,
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, SPAN_KEY]);
});
