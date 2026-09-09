import { describe, it, expect } from 'vitest';
import PromoCard from '@civictheme/molecules/PromoCard.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'promo-card' };

const REQUIRED_KEY = 'Promo Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Promo Card Component renders with optional attributes 1';
const NO_TITLE_KEY = 'Promo Card Component does not render when title is empty 1';
const LINK_KEY = 'Promo Card Component renders with link when provided 1';

describe('PromoCard', () => {
  parityCase(meta, REQUIRED_KEY, PromoCard, {
    title: 'Promo Card Title',
    summary: 'This is the summary of the promo card.',
  });

  parityCase(meta, OPTIONAL_KEY, PromoCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    subtitle: 'Subtitle text',
    date: '2023-12-01',
    dateIso: '2023-12-01T00:00:00Z',
    title: 'Promo Card Title',
    summary: 'This is the summary of the promo card.',
    link: { url: 'https://example.com', isNewWindow: true, isExternal: true },
    tags: ['Tag1', 'Tag2'],
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, PromoCard, {
    title: '',
    summary: 'This is the summary of the promo card.',
  });

  parityCase(meta, LINK_KEY, PromoCard, {
    title: 'Promo Card Title',
    summary: 'This is the summary of the promo card.',
    link: { url: 'https://example.com' },
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_TITLE_KEY, LINK_KEY]);

  // Task 14c: every Slot-documented prop also has an Astro slot that takes
  // precedence over the string prop.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PromoCard, { title: 'Promo Title' });
      const viaSlot = await renderNormalised(PromoCard, {}, { title: 'Promo Title' });
      expect(viaSlot).toBe(viaProp);
    });

    it('imageOver: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PromoCard, { title: 'x', imageOver: 'Over content' });
      const viaSlot = await renderNormalised(PromoCard, { title: 'x' }, { imageOver: 'Over content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PromoCard, { title: 'x', contentTop: 'Top content' });
      const viaSlot = await renderNormalised(PromoCard, { title: 'x' }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentMiddle: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PromoCard, { title: 'x', contentMiddle: 'Middle content' });
      const viaSlot = await renderNormalised(PromoCard, { title: 'x' }, { contentMiddle: 'Middle content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('summary: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PromoCard, { title: 'x', summary: 'A summary.' });
      const viaSlot = await renderNormalised(
        PromoCard,
        { title: 'x' },
        {
          summary:
            '<div class="ct-paragraph ct-paragraph--no-margin ct-paragraph--regular ct-promo-card__summary ct-theme-light">A summary.</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PromoCard, { title: 'x', contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(PromoCard, { title: 'x' }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a title slot alone (no string prop) still renders the card', async () => {
      const html = await renderNormalised(PromoCard, {}, { title: 'Live Title' });
      expect(html).toContain('ct-promo-card__title');
      expect(html).toContain('Live Title');
    });
  });
});
