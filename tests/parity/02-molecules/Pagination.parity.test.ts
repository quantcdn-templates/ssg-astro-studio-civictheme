import { describe } from 'vitest';
import Pagination from '@civictheme/molecules/Pagination.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'pagination' };

const REQUIRED_KEY = 'Pagination Component renders with required attributes 1';
const OPTIONAL_KEY = 'Pagination Component renders with optional attributes 1';
const EMPTY_KEY = 'Pagination Component does not render when items are empty 1';
const CURRENT_PAGE_KEY = 'Pagination Component renders current page correctly 1';

describe('Pagination', () => {
  parityCase(meta, REQUIRED_KEY, Pagination, {
    theme: 'light',
    items: {
      previous: { text: 'Previous', href: '#previous' },
      pages: {
        1: { href: '#1' },
        2: { href: '#2' },
        3: { href: '#3' },
      },
      next: { text: 'Next', href: '#next' },
    },
    current: '2',
  });

  parityCase(meta, OPTIONAL_KEY, Pagination, {
    theme: 'dark',
    headingId: 'pagination-heading',
    items: {
      first: { text: 'First', href: '#first' },
      previous: { text: 'Previous', href: '#previous' },
      pages: {
        1: { href: '#1' },
        2: { href: '#2' },
        3: { href: '#3' },
      },
      next: { text: 'Next', href: '#next' },
      last: { text: 'Last', href: '#last' },
    },
    current: '2',
    itemsPerPageTitle: 'Items per page',
    itemsPerPageOptions: [
      { type: 'option', label: '10', value: '10', selected: 'selected' },
      { type: 'option', label: '20', value: '20' },
      { type: 'option', label: '50', value: '50' },
    ],
    itemsPerPageName: 'itemsPerPage',
    itemsPerPageId: 'items-per-page',
    itemsPerPageAttributes: { 'data-test': 'items-per-page' },
    useEllipsis: true,
    'data-test': 'pagination',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Pagination, {
    items: [],
  });

  parityCase(meta, CURRENT_PAGE_KEY, Pagination, {
    items: {
      previous: { text: 'Previous', href: '#previous' },
      pages: {
        1: { href: '#1' },
        2: { href: '#2' },
        3: { href: '#3' },
      },
      next: { text: 'Next', href: '#next' },
    },
    current: '2',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, CURRENT_PAGE_KEY]);
});
