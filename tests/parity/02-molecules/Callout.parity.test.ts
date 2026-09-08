import { describe } from 'vitest';
import Callout from '@civictheme/molecules/Callout.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'callout' };

const REQUIRED_KEY = 'Callout Component renders with required attributes 1';
const OPTIONAL_KEY = 'Callout Component renders with optional attributes 1';
const MULTI_KEY = 'Callout Component renders with multiple links 1';

describe('Callout', () => {
  parityCase(meta, REQUIRED_KEY, Callout, {
    content: 'This is the main content of the callout.',
  });

  parityCase(meta, OPTIONAL_KEY, Callout, {
    contentTop: 'Top content',
    title: 'Callout Title',
    content: 'This is the main content of the callout.',
    links: [
      { text: 'Link 1', url: 'https://example.com', isNewWindow: true, isExternal: true },
      { text: 'Link 2', url: 'https://example.com' },
    ],
    contentBottom: 'Bottom content',
    theme: 'dark',
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, MULTI_KEY, Callout, {
    links: [
      { text: 'Link 1', url: 'https://example.com' },
      { text: 'Link 2', url: 'https://example.com' },
      { text: 'Link 3', url: 'https://example.com' },
    ],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, MULTI_KEY]);
});
