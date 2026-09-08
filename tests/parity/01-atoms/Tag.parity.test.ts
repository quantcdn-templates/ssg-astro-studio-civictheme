import { describe } from 'vitest';
import Tag from '@civictheme/atoms/Tag.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'tag' };

const REQUIRED_KEY = 'Tag Component renders with required attributes 1';
const OPTIONAL_KEY = 'Tag Component renders with optional attributes 1';
const EMPTY_KEY = 'Tag Component does not render when content is empty 1';

describe('Tag', () => {
  parityCase(meta, REQUIRED_KEY, Tag, {
    content: 'Sample Tag',
  });

  parityCase(meta, OPTIONAL_KEY, Tag, {
    content: 'Sample Tag',
    type: 'secondary',
    icon: 'call',
    iconPlacement: 'before',
    url: 'https://example.com',
    isNewWindow: true,
    isExternal: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Tag, {
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
