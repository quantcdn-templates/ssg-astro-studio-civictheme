import { describe } from 'vitest';
import Link from '@civictheme/atoms/Link.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'link' };

const REQUIRED_KEY = 'Link Component renders with required attributes 1';
const NOT_EXTERNAL_KEY = 'Link Component renders with optional attributes, not external 1';
const EXTERNAL_KEY = 'Link Component renders with optional attributes, is external 1';
const EMPTY_KEY = 'Link Component does not render when text and icon are empty 1';

describe('Link', () => {
  parityCase(meta, REQUIRED_KEY, Link, {
    text: 'Sample Link',
    url: 'https://example.com',
  });

  parityCase(meta, NOT_EXTERNAL_KEY, Link, {
    text: 'Sample Link',
    url: 'https://example.com',
    title: 'Example Title',
    isNewWindow: true,
    isExternal: false,
    isActive: true,
    isDisabled: true,
    icon: 'call',
    iconPlacement: 'before',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EXTERNAL_KEY, Link, {
    text: 'Sample Link',
    url: 'https://example.com',
    title: 'Example Title',
    isNewWindow: true,
    isExternal: true,
    isActive: true,
    isDisabled: true,
    icon: 'call',
    iconPlacement: 'before',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Link, {
    text: '',
    icon: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, NOT_EXTERNAL_KEY, EXTERNAL_KEY, EMPTY_KEY]);
});
