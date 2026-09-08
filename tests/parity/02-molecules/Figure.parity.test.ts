import { describe } from 'vitest';
import Figure from '@civictheme/molecules/Figure.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'figure' };

const REQUIRED_KEY = 'Figure Component renders with required attributes 1';
const OPTIONAL_KEY = 'Figure Component renders with optional attributes 1';
const EMPTY_KEY = 'Figure Component does not render when URL is empty 1';

describe('Figure', () => {
  parityCase(meta, REQUIRED_KEY, Figure, {
    url: 'https://example.com/image.jpg',
    alt: 'Image description',
  });

  parityCase(meta, OPTIONAL_KEY, Figure, {
    url: 'https://example.com/image.jpg',
    alt: 'Image description',
    width: 500,
    height: 300,
    caption: 'This is the image caption.',
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Figure, {
    url: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
