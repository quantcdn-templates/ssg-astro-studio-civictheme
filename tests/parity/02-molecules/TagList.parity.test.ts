import { describe } from 'vitest';
import TagList from '@civictheme/molecules/TagList.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'tag-list' };

const REQUIRED_KEY = 'Tag List Component renders with required attributes 1';
const OPTIONAL_KEY = 'Tag List Component renders with optional attributes 1';
const EMPTY_KEY = 'Tag List Component does not render when tags are empty 1';
const SLOTS_KEY = 'Tag List Component renders with content slots 1';

describe('TagList', () => {
  parityCase(meta, REQUIRED_KEY, TagList, {
    tags: ['Tag 1', 'Tag 2', 'Tag 3'],
  });

  parityCase(meta, OPTIONAL_KEY, TagList, {
    tags: ['Tag 1', 'Tag 2'],
    theme: 'dark',
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'custom-class',
    contentTop: 'Top content',
    contentBottom: 'Bottom content',
  });

  parityCase(meta, EMPTY_KEY, TagList, {
    tags: [],
  });

  parityCase(meta, SLOTS_KEY, TagList, {
    tags: ['Tag 1', 'Tag 2'],
    contentTop: 'Top content',
    contentBottom: 'Bottom content',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, SLOTS_KEY]);
});
