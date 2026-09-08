import { describe } from 'vitest';
import Chip from '@civictheme/atoms/Chip.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'chip' };

const REQUIRED_KEY = 'Chip Component renders with required attributes 1';
const OPTIONAL_KEY = 'Chip Component renders with optional attributes 1';
const EMPTY_KEY = 'Chip Component does not render when content is empty 1';

describe('Chip', () => {
  parityCase(meta, REQUIRED_KEY, Chip, {
    content: 'Sample Chip',
    kind: 'default',
    size: 'regular',
  });

  parityCase(meta, OPTIONAL_KEY, Chip, {
    content: 'Sample Chip',
    kind: 'input',
    size: 'large',
    isSelected: true,
    isDismissible: true,
    isMultiple: true,
    groupParent: 'test-group',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Chip, {
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
