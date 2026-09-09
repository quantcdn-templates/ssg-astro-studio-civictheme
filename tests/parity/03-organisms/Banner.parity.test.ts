import { describe, it, expect } from 'vitest';
import Banner from '@civictheme/organisms/Banner.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

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

  // banner.twig:78,84 — `breadcrumb is not empty` / `featured_image is not
  // empty` are Twig's `empty` test on an OBJECT (property-count check),
  // not `.links.length`/`.url` specifically — not exercised by any
  // upstream snapshot, so tested directly.
  it('opens the breadcrumb row (outer gate) for a breadcrumb object with no links key', async () => {
    // Breadcrumb.astro itself renders nothing for an empty `links` array —
    // what this asserts is that Banner's OWN gate (whether the row/column
    // wrapper opens at all) reacts to object-presence, not to `.links`.
    const rowCount = (html: string) => [...html.matchAll(/<div class="row">/g)].length;
    const withoutLinks = await renderNormalised(Banner, { title: 'T', breadcrumb: { activeIsLink: true } });
    const withoutBreadcrumb = await renderNormalised(Banner, { title: 'T' });
    expect(rowCount(withoutLinks)).toBe(rowCount(withoutBreadcrumb) + 1);
  });

  it('widens to col-m-6 for a featuredImage object with no url', async () => {
    const html = await renderNormalised(Banner, { title: 'T', featuredImage: { alt: 'no url' } });
    expect(html).toContain('col-m-6');
    // Image.astro's own `url` gate still means no <img> renders.
    expect(html).not.toContain('<img');
  });

  describe('slots', () => {
    const NAMES = [
      'contentTop1',
      'contentTop2',
      'contentTop3',
      'contentMiddle',
      'content',
      'contentBelow',
      'contentBottom',
    ] as const;

    for (const name of NAMES) {
      it(`${name}: slot renders identically to the string prop`, async () => {
        const viaProp = await renderNormalised(Banner, { [name]: 'Slotted content' });
        const viaSlot = await renderNormalised(Banner, {}, { [name]: 'Slotted content' });
        expect(viaSlot).toBe(viaProp);
      });
    }

    // `title`/`siteSection` route their string prop through `Heading`, which
    // adds its own wrapper markup — the slot renders the caller's markup
    // directly, so parity is checked against Heading's own known output.
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Banner, { title: 'Banner Title' });
      const viaSlot = await renderNormalised(
        Banner,
        {},
        { title: '<h1 class="ct-heading ct-banner__title ct-theme-light">Banner Title</h1>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('siteSection: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Banner, { siteSection: 'Section' });
      const viaSlot = await renderNormalised(
        Banner,
        {},
        { siteSection: '<h5 class="ct-heading ct-banner__site-section ct-theme-light">Section</h5>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(Banner, {}, { content: 'Live Content' });
      expect(html).toContain('ct-banner__content');
      expect(html).toContain('Live Content');
    });
  });
});
