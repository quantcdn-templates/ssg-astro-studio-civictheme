import { describe } from 'vitest';
import ContentLink from '@civictheme/atoms/ContentLink.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'content-link' };

const REQUIRED_KEY = 'Content Link Component renders with required attributes 1';
const OPTIONAL_KEY = 'Content Link Component renders with optional attributes 1';
const EMPTY_KEY = 'Content Link Component does not render when text is empty 1';

describe('Content Link', () => {
  parityCase(meta, REQUIRED_KEY, ContentLink, {
    text: 'Sample Link',
    url: 'https://example.com',
  });

  parityCase(meta, OPTIONAL_KEY, ContentLink, {
    text: 'Sample Link',
    url: 'https://example.com',
    title: 'Example Title',
    isNewWindow: true,
    isExternal: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, ContentLink, {
    text: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
