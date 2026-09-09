import { describe } from 'vitest';
import Campaign from '@civictheme/organisms/Campaign.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '03-organisms', name: 'campaign' };

const ATTRS_KEY = 'Campaign Component renders with attributes 1';
const TAGS_KEY = 'Campaign Component renders with tags 1';
const RIGHT_KEY = 'Campaign Component renders with image position right 1';

describe('Campaign', () => {
  parityCase(meta, ATTRS_KEY, Campaign, {
    title: 'Campaign Title',
    content: 'This is the main content of the campaign.',
    contentTop: 'Top content',
    image: { url: 'http://example.com/image.jpg', alt: 'Example Image' },
    imagePosition: 'left',
    tags: ['Tag1', 'Tag2'],
    date: '2024-06-19',
    links: [
      { text: 'Link 1', url: 'http://example.com/1', isNewWindow: true, isExternal: true },
      { text: 'Link 2', url: 'http://example.com/2', isNewWindow: false, isExternal: false },
    ],
    contentBottom: 'Bottom content',
    theme: 'dark',
    verticalSpacing: 'both',
    class: 'custom-class',
    'data-test': 'true',
  });

  parityCase(meta, TAGS_KEY, Campaign, {
    tags: ['Tag1', 'Tag2'],
  });

  parityCase(meta, RIGHT_KEY, Campaign, {
    imagePosition: 'right',
    image: { url: 'http://example.com/image.jpg', alt: 'Example Image' },
  });

  expectAllKeysCovered(meta, [ATTRS_KEY, TAGS_KEY, RIGHT_KEY]);
});
