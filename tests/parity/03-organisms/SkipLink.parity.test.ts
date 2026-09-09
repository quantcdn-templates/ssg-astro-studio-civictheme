import { describe } from 'vitest';
import SkipLink from '@civictheme/organisms/SkipLink.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '03-organisms', name: 'skip-link' };

const REQUIRED_KEY = 'Skip Link Component renders with only required attributes 1';
const ALL_KEY = 'Skip Link Component renders with all attributes provided 1';
const DEFAULT_TEXT_KEY = 'Skip Link Component renders with default text when text is empty 1';

describe('SkipLink', () => {
  parityCase(meta, REQUIRED_KEY, SkipLink, {
    url: '#main-content',
  });

  parityCase(meta, ALL_KEY, SkipLink, {
    theme: 'dark',
    text: 'Go to main content',
    url: '#main-content',
    class: 'additional-class',
  });

  parityCase(meta, DEFAULT_TEXT_KEY, SkipLink, {
    theme: 'light',
    text: '',
    url: '#main-content',
    class: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, ALL_KEY, DEFAULT_TEXT_KEY]);
});
