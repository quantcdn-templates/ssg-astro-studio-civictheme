import { describe, it, expect } from 'vitest';
import Promo from '@civictheme/organisms/Promo.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'promo' };

const REQUIRED_KEY = 'Promo Component renders with only required attributes 1';
const ALL_KEY = 'Promo Component renders with all attributes provided 1';
const NO_BOTTOM_LINK_KEY = 'Promo Component renders without content_bottom and link 1';
const NO_TOP_BOTTOM_KEY = 'Promo Component renders without content_top and content_bottom 1';
const EMPTY_KEY = 'Promo Component does not render when title and content are empty 1';

describe('Promo', () => {
  parityCase(meta, REQUIRED_KEY, Promo, {
    title: 'Promo Title',
    content: 'Promo content text.',
  });

  parityCase(meta, ALL_KEY, Promo, {
    contentTop: 'Top Content',
    title: 'Promo Title',
    content: 'Promo content text.',
    isContained: true,
    link: {
      text: 'Learn More',
      url: 'https://example.com',
      isNewWindow: true,
      isExternal: true,
    },
    contentBottom: 'Bottom Content',
    theme: 'dark',
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'additional-class',
  });

  parityCase(meta, NO_BOTTOM_LINK_KEY, Promo, {
    contentTop: 'Top Content',
    title: 'Promo Title',
    content: 'Promo content text.',
    isContained: true,
    contentBottom: '',
    link: null,
    theme: 'light',
    verticalSpacing: '',
    withBackground: false,
    class: '',
  });

  parityCase(meta, NO_TOP_BOTTOM_KEY, Promo, {
    title: 'Promo Title',
    content: 'Promo content text.',
    isContained: false,
    link: {
      text: 'Learn More',
      url: 'https://example.com',
      isNewWindow: false,
      isExternal: false,
    },
    contentTop: '',
    contentBottom: '',
    theme: 'light',
    verticalSpacing: '',
    withBackground: false,
    class: '',
  });

  parityCase(meta, EMPTY_KEY, Promo, {
    title: '',
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, ALL_KEY, NO_BOTTOM_LINK_KEY, NO_TOP_BOTTOM_KEY, EMPTY_KEY]);

  // Not exercised by any upstream snapshot: `{% if link %}` is a plain
  // Twig truthy test on an object, which (like the `is not empty` review
  // fixes already documented in PORTING.md) is a property-count check —
  // `link: {}` is falsy, same as `null`/absent, not "any object is truthy".
  it('does not render the links row for an empty link object', async () => {
    const html = await renderNormalised(Promo, { title: 'T', content: 'C', link: {} });
    expect(html).not.toContain('ct-promo__links');
  });
});
