import { describe } from 'vitest';
import Heading from '@civictheme/atoms/Heading.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'heading' };

const REQUIRED_KEY = 'Heading Component renders with required attributes 1';
const OPTIONAL_KEY = 'Heading Component renders with optional attributes 1';
const EMPTY_KEY = 'Heading Component does not render when content is empty 1';

describe('Heading', () => {
  parityCase(meta, REQUIRED_KEY, Heading, {
    content: 'Sample Heading',
  });

  parityCase(meta, OPTIONAL_KEY, Heading, {
    content: 'Sample Heading',
    level: '3',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Heading, {
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
