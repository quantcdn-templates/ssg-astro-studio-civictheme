import { describe } from 'vitest';
import GroupFilter from '@civictheme/molecules/GroupFilter.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'group-filter' };

const DEFAULT_KEY = 'Group Filter Component renders with default values 1';
const CUSTOM_TITLE_KEY = 'Group Filter Component renders with custom title and submit text 1';
const CONTENT_KEY = 'Group Filter Component renders with content top and bottom 1';
const FORM_KEY = 'Group Filter Component renders with form attributes and hidden fields 1';
const ATTRS_KEY = 'Group Filter Component renders with custom attributes and classes 1';
const EMPTY_KEY = 'Group Filter Component does not render when filters are empty 1';

const filters = [
  { title: 'Filter 1', content: 'Content 1' },
  { title: 'Filter 2', content: 'Content 2' },
];

describe('GroupFilter', () => {
  parityCase(meta, DEFAULT_KEY, GroupFilter, {
    filters,
    groupId: '42',
  });

  parityCase(meta, CUSTOM_TITLE_KEY, GroupFilter, {
    title: 'Custom Title',
    submitText: 'Submit Filters',
    filters,
    groupId: '42',
  });

  parityCase(meta, CONTENT_KEY, GroupFilter, {
    contentTop: 'Top Content',
    contentBottom: 'Bottom Content',
    filters,
    groupId: '42',
  });

  parityCase(meta, FORM_KEY, GroupFilter, {
    formAttributes: { id: 'filter-form', action: '/filters', method: 'POST' },
    formHiddenFields: '<input type="hidden" name="token" value="12345">',
    filters,
    groupId: '42',
  });

  parityCase(meta, ATTRS_KEY, GroupFilter, {
    filters,
    'data-test': 'true',
    class: 'custom-modifier',
    groupId: '42',
  });

  parityCase(meta, EMPTY_KEY, GroupFilter, {
    filters: [],
  });

  expectAllKeysCovered(meta, [DEFAULT_KEY, CUSTOM_TITLE_KEY, CONTENT_KEY, FORM_KEY, ATTRS_KEY, EMPTY_KEY]);
});
