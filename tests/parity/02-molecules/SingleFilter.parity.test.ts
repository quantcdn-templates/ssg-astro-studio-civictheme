import { describe } from 'vitest';
import SingleFilter from '@civictheme/molecules/SingleFilter.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'single-filter' };

const REQUIRED_KEY = 'Single Filter Component renders with required attributes 1';
const OPTIONAL_KEY = 'Single Filter Component renders with optional attributes 1';
const EMPTY_KEY = 'Single Filter Component does not render when items are empty 1';
const MULTIPLE_KEY = 'Single Filter Component renders with multiple selection enabled 1';

describe('SingleFilter', () => {
  parityCase(meta, REQUIRED_KEY, SingleFilter, {
    title: 'Filter results by:',
    items: [{ text: 'Filter 1', isSelected: true }, { text: 'Filter 2' }],
    submitText: 'Apply filter',
  });

  parityCase(meta, OPTIONAL_KEY, SingleFilter, {
    contentTop: 'Top content',
    title: 'Filter results by:',
    items: [{ text: 'Filter 1', isSelected: true, 'data-test': 'true' }, { text: 'Filter 2' }],
    submitText: 'Apply filter',
    resetText: 'Clear all',
    contentBottom: 'Bottom content',
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, SingleFilter, {
    items: [],
  });

  parityCase(meta, MULTIPLE_KEY, SingleFilter, {
    title: 'Filter results by:',
    items: [
      { text: 'Filter 1', isSelected: true, name: 'filter1' },
      { text: 'Filter 2', name: 'filter2' },
    ],
    isMultiple: true,
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, MULTIPLE_KEY]);
});
