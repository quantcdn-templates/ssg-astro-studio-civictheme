import { describe, it, expect } from 'vitest';
import NavigationCard from '@civictheme/molecules/NavigationCard.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'navigation-card' };

const REQUIRED_KEY = 'Navigation Card Component renders with required attributes 1';
const OPTIONAL_ICON_KEY = 'Navigation Card Component renders with optional attributes, with icon 1';
const OPTIONAL_NO_ICON_KEY = 'Navigation Card Component renders with optional attributes, no icon, image as not icon 1';
const NO_TITLE_KEY = 'Navigation Card Component does not render when title is empty 1';
const IMAGE_AS_ICON_KEY = 'Navigation Card Component renders with image as icon 1';
const LINK_KEY = 'Navigation Card Component renders with link when provided 1';

describe('NavigationCard', () => {
  parityCase(meta, REQUIRED_KEY, NavigationCard, {
    title: 'Card Title',
    summary: 'This is a summary of the card.',
  });

  parityCase(meta, OPTIONAL_ICON_KEY, NavigationCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    imageAsIcon: true,
    icon: 'call',
    title: 'Card Title',
    summary: 'This is a summary of the card.',
    link: { text: 'Learn more', url: 'https://example.com', isNewWindow: true, isExternal: true },
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, OPTIONAL_NO_ICON_KEY, NavigationCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    imageAsIcon: false,
    icon: '',
    title: 'Card Title',
    summary: 'This is a summary of the card.',
    link: { text: 'Learn more', url: 'https://example.com', isNewWindow: true, isExternal: true },
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, NavigationCard, {
    title: '',
    summary: 'This is a summary of the card.',
  });

  parityCase(meta, IMAGE_AS_ICON_KEY, NavigationCard, {
    title: 'Card Title',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    imageAsIcon: true,
  });

  parityCase(meta, LINK_KEY, NavigationCard, {
    title: 'Card Title',
    summary: 'This is a summary of the card.',
    link: { text: 'Learn more', url: 'https://example.com' },
  });

  expectAllKeysCovered(meta, [
    REQUIRED_KEY,
    OPTIONAL_ICON_KEY,
    OPTIONAL_NO_ICON_KEY,
    NO_TITLE_KEY,
    IMAGE_AS_ICON_KEY,
    LINK_KEY,
  ]);

  // Task 14c: every Slot-documented prop except `icon` also has an Astro
  // slot that takes precedence over the string prop.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NavigationCard, { title: 'Card Title' });
      const viaSlot = await renderNormalised(NavigationCard, {}, { title: 'Card Title' });
      expect(viaSlot).toBe(viaProp);
    });

    it('imageOver: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NavigationCard, {
        title: 'x',
        image: { url: 'https://example.com/image.jpg' },
        imageOver: 'Over content',
      });
      const viaSlot = await renderNormalised(
        NavigationCard,
        { title: 'x', image: { url: 'https://example.com/image.jpg' } },
        { imageOver: 'Over content' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NavigationCard, { title: 'x', contentTop: 'Top content' });
      const viaSlot = await renderNormalised(NavigationCard, { title: 'x' }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentMiddle: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NavigationCard, { title: 'x', contentMiddle: 'Middle content' });
      const viaSlot = await renderNormalised(NavigationCard, { title: 'x' }, { contentMiddle: 'Middle content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('summary: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NavigationCard, { title: 'x', summary: 'A summary.' });
      const viaSlot = await renderNormalised(
        NavigationCard,
        { title: 'x' },
        {
          summary:
            '<div class="ct-navigation-card__summary ct-paragraph ct-paragraph--no-margin ct-paragraph--regular ct-theme-light">A summary.</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NavigationCard, { title: 'x', contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(NavigationCard, { title: 'x' }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a title slot alone (no string prop) still renders the card', async () => {
      const html = await renderNormalised(NavigationCard, {}, { title: 'Live Title' });
      expect(html).toContain('ct-navigation-card__title');
      expect(html).toContain('Live Title');
    });
  });
});
