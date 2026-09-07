import { describe } from 'vitest';
import Paragraph from '@civictheme/atoms/Paragraph.astro';
import { parityCase } from '../harness';

const meta = { layer: '01-atoms', name: 'paragraph' };

describe('Paragraph', () => {
  parityCase(meta, 'Paragraph Component renders with required attributes 1', Paragraph, {
    content: 'Sample content',
  });

  parityCase(meta, 'Paragraph Component renders with optional attributes 1', Paragraph, {
    content: 'Sample content',
    size: 'large',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, 'Paragraph Component does not render when content is empty 1', Paragraph, {
    content: '',
  });
});
