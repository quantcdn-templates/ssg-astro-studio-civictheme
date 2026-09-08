import { describe } from 'vitest';
import ItemList from '@civictheme/base/ItemList.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '00-base', name: 'item-list' };

const items = ['<a href="/">Home</a>', '<a href="/about">About</a>', '<a href="/contact">Contact</a>'];

const DEFAULT_KEY = 'Link List Component renders with default values 1';
const VERTICAL_KEY = 'Link List Component renders with vertical direction 1';
const LARGE_KEY = 'Link List Component renders with large size 1';
const NO_GAP_KEY = 'Link List Component renders without gaps 1';
const CUSTOM_KEY = 'Link List Component renders with custom attributes and classes 1';
const EMPTY_KEY = 'Link List Component does not render when items are empty 1';

describe('ItemList', () => {
  parityCase(meta, DEFAULT_KEY, ItemList, { items });

  parityCase(meta, VERTICAL_KEY, ItemList, { direction: 'vertical', items });

  parityCase(meta, LARGE_KEY, ItemList, { size: 'large', items });

  parityCase(meta, NO_GAP_KEY, ItemList, { noGap: true, items });

  parityCase(meta, CUSTOM_KEY, ItemList, {
    items,
    'data-test': 'true',
    class: 'custom-modifier',
  });

  parityCase(meta, EMPTY_KEY, ItemList, { items: [] });

  expectAllKeysCovered(meta, [DEFAULT_KEY, VERTICAL_KEY, LARGE_KEY, NO_GAP_KEY, CUSTOM_KEY, EMPTY_KEY]);
});
