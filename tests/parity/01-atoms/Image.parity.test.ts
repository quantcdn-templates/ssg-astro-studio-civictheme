import { describe } from 'vitest';
import Image from '@civictheme/atoms/Image.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'image' };

const REQUIRED_KEY = 'Image Component renders with required attributes 1';
const OPTIONAL_KEY = 'Image Component renders with optional attributes 1';
const EMPTY_KEY = 'Image Component does not render when url is empty 1';

describe('Image', () => {
  parityCase(meta, REQUIRED_KEY, Image, {
    url: 'https://example.com/image.jpg',
  });

  parityCase(meta, OPTIONAL_KEY, Image, {
    url: 'https://example.com/image.jpg',
    alt: 'Sample Image',
    width: '600',
    height: '400',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Image, {
    url: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
