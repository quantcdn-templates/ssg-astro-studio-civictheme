import { describe } from 'vitest';
import Banner from '@civictheme/organisms/Banner.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '03-organisms', name: 'banner' };

const REQUIRED_KEY = 'Banner Component renders with only required attributes 1';
const ALL_KEY = 'Banner Component renders with all attributes provided 1';
const NO_EXTRA_KEY = 'Banner Component renders without additional attributes and classes 1';
const EMPTY_KEY = 'Banner Component does not render when all content slots are empty 1';

describe('Banner', () => {
  parityCase(meta, REQUIRED_KEY, Banner, {
    title: 'Banner Title',
  });

  parityCase(meta, ALL_KEY, Banner, {
    contentTop1: 'Top Content 1',
    breadcrumb: {
      links: [
        { text: 'Home', url: '/' },
        { text: 'Section', url: '/section' },
      ],
      activeIsLink: true,
    },
    contentTop2: 'Top Content 2',
    contentTop3: 'Top Content 3',
    contentMiddle: 'Middle Content',
    content: 'Main Content',
    contentBottom: 'Bottom Content',
    contentBelow: 'Below Content',
    siteSection: 'Site Section',
    title: 'Banner Title',
    isDecorative: true,
    featuredImage: { url: 'https://example.com/image.jpg', alt: 'Featured Image' },
    backgroundImage: { url: 'https://example.com/background.jpg', alt: 'Background Image' },
    backgroundImageBlendMode: 'multiply',
    theme: 'dark',
    class: 'additional-class',
    'data-test': 'true',
  });

  parityCase(meta, NO_EXTRA_KEY, Banner, {
    title: 'Banner Title',
    theme: 'light',
    class: '',
  });

  parityCase(meta, EMPTY_KEY, Banner, {});

  expectAllKeysCovered(meta, [REQUIRED_KEY, ALL_KEY, NO_EXTRA_KEY, EMPTY_KEY]);
});
