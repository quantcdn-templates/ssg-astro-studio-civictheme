import { describe } from 'vitest';
import Popover from '@civictheme/atoms/Popover.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'popover' };

const REQUIRED_KEY = 'Popover Component renders with required attributes 1';
const OPTIONAL_KEY = 'Popover Component renders with optional attributes 1';
const EMPTY_KEY = 'Popover Component does not render when content is empty 1';

describe('Popover', () => {
  parityCase(meta, REQUIRED_KEY, Popover, {
    trigger: { text: 'Sample Trigger' },
    content: '<span>Sample content</span>',
  });

  parityCase(meta, OPTIONAL_KEY, Popover, {
    trigger: {
      text: 'Sample Trigger',
      url: 'https://example.com',
      isNewWindow: true,
      isExternal: true,
    },
    content: 'Sample content',
    group: 'sample-group',
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Popover, {
    trigger: { text: 'Sample Trigger' },
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
