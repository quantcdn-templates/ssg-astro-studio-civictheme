import { describe } from 'vitest';
import Iframe from '@civictheme/atoms/Iframe.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'iframe' };

const REQUIRED_KEY = 'Iframe Component renders with required attributes 1';
const OPTIONAL_KEY = 'Iframe Component renders with optional attributes 1';

describe('Iframe', () => {
  parityCase(meta, REQUIRED_KEY, Iframe, {
    url: 'https://example.com',
  });

  parityCase(meta, OPTIONAL_KEY, Iframe, {
    url: 'https://example.com',
    width: 600,
    height: 400,
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY]);
});
