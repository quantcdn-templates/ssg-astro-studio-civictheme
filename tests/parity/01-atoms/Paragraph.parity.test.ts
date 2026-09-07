import { describe } from 'vitest';
import Paragraph from '@civictheme/atoms/Paragraph.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'paragraph' };

const REQUIRED_KEY = 'Paragraph Component renders with required attributes 1';
const OPTIONAL_KEY = 'Paragraph Component renders with optional attributes 1';
const EMPTY_KEY = 'Paragraph Component does not render when content is empty 1';

describe('Paragraph', () => {
  parityCase(meta, REQUIRED_KEY, Paragraph, {
    content: 'Sample content',
  });

  parityCase(meta, OPTIONAL_KEY, Paragraph, {
    content: 'Sample content',
    size: 'large',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Paragraph, {
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
