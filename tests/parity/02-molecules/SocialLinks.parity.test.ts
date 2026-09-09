import { describe } from 'vitest';
import SocialLinks from '@civictheme/molecules/SocialLinks.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'social-links' };

const REQUIRED_KEY = 'Social Links Component renders with required attributes 1';
const OPTIONAL_KEY = 'Social Links Component renders with optional attributes 1';
const EMPTY_KEY = 'Social Links Component does not render when items are empty 1';
const ICON_HTML_KEY = 'Social Links Component renders with icon HTML 1';

describe('SocialLinks', () => {
  parityCase(meta, REQUIRED_KEY, SocialLinks, {
    items: [
      { title: 'Facebook', icon: 'facebook', url: 'https://facebook.com' },
      { title: 'Twitter', icon: 'twitter', url: 'https://twitter.com' },
    ],
  });

  parityCase(meta, OPTIONAL_KEY, SocialLinks, {
    items: [
      { title: 'Facebook', icon: 'facebook', url: 'https://facebook.com', iconHtml: '<svg></svg>' },
      { title: 'Twitter', icon: 'twitter', url: 'https://twitter.com', iconHtml: '<svg></svg>' },
    ],
    withBorder: true,
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, SocialLinks, {
    items: [],
  });

  parityCase(meta, ICON_HTML_KEY, SocialLinks, {
    items: [
      { title: 'Facebook', iconHtml: '<svg></svg>', url: 'https://facebook.com' },
      { title: 'Twitter', iconHtml: '<svg></svg>', url: 'https://twitter.com' },
    ],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, ICON_HTML_KEY]);
});
