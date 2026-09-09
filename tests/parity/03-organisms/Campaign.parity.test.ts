import { describe, it, expect } from 'vitest';
import Campaign from '@civictheme/organisms/Campaign.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

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

  // Task 14c: every Slot-documented prop also has an Astro slot that takes
  // precedence over the string prop.
  describe('slot vs string-prop parity', () => {
    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Campaign, { contentTop: 'Top content' });
      const viaSlot = await renderNormalised(Campaign, {}, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Campaign, { title: 'Campaign Title' });
      const viaSlot = await renderNormalised(
        Campaign,
        {},
        { title: '<h2 class="ct-campaign__title ct-heading ct-theme-light">Campaign Title</h2>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('content: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Campaign, { content: 'Some content.' });
      const viaSlot = await renderNormalised(
        Campaign,
        {},
        {
          content:
            '<div class="ct-campaign__content ct-paragraph ct-paragraph--large ct-theme-light">Some content.</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Campaign, { contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(Campaign, {}, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(Campaign, {}, { contentTop: 'Live Top' });
      expect(html).toContain('ct-campaign__content-top');
      expect(html).toContain('Live Top');
    });
  });
});
