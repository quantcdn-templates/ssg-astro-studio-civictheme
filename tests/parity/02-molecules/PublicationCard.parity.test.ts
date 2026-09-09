import { describe, it, expect } from 'vitest';
import PublicationCard from '@civictheme/molecules/PublicationCard.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'publication-card' };

const REQUIRED_KEY = 'Publication Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Publication Card Component renders with optional attributes 1';
const NO_FILE_KEY = 'Publication Card Component does not render when file is empty 1';
const EXT_SIZE_KEY = 'Publication Card Component renders file link with extension and size 1';
const SUMMARY_KEY = 'Publication Card Component renders with summary when provided 1';

describe('PublicationCard', () => {
  parityCase(meta, REQUIRED_KEY, PublicationCard, {
    file: {
      name: 'Sample File',
      ext: 'PDF',
      url: 'https://example.com/sample.pdf',
      size: '2MB',
    },
    title: 'Publication Card Title',
  });

  parityCase(meta, OPTIONAL_KEY, PublicationCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    title: 'Publication Card Title',
    summary: 'This is the summary of the publication card.',
    file: {
      name: 'Sample File',
      ext: 'PDF',
      url: 'https://example.com/sample.pdf',
      size: '2MB',
    },
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_FILE_KEY, PublicationCard, {
    file: {},
  });

  parityCase(meta, EXT_SIZE_KEY, PublicationCard, {
    file: {
      name: 'Sample File',
      ext: 'PDF',
      url: 'https://example.com/sample.pdf',
      size: '2MB',
    },
  });

  parityCase(meta, SUMMARY_KEY, PublicationCard, {
    file: {
      name: 'Sample File',
      ext: 'PDF',
      url: 'https://example.com/sample.pdf',
      size: '2MB',
    },
    summary: 'This is the summary of the publication card.',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_FILE_KEY, EXT_SIZE_KEY, SUMMARY_KEY]);

  // Task 14c: every Slot-documented prop also has an Astro slot that takes
  // precedence over the string prop.
  describe('slot vs string-prop parity', () => {
    const file = { url: 'https://example.com/sample.pdf' };

    it('imageOver: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PublicationCard, {
        file,
        image: { url: 'https://example.com/image.jpg' },
        imageOver: 'Over content',
      });
      const viaSlot = await renderNormalised(
        PublicationCard,
        { file, image: { url: 'https://example.com/image.jpg' } },
        { imageOver: 'Over content' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PublicationCard, { file, contentTop: 'Top content' });
      const viaSlot = await renderNormalised(PublicationCard, { file }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentMiddle: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PublicationCard, { file, contentMiddle: 'Middle content' });
      const viaSlot = await renderNormalised(PublicationCard, { file }, { contentMiddle: 'Middle content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('summary: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PublicationCard, { file, summary: 'A summary.' });
      const viaSlot = await renderNormalised(
        PublicationCard,
        { file },
        {
          summary:
            '<div class="ct-paragraph ct-paragraph--no-margin ct-paragraph--regular ct-publication-card__summary ct-theme-light">A summary.</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(PublicationCard, { file, contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(PublicationCard, { file }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(PublicationCard, { file }, { contentTop: 'Live Top' });
      expect(html).toContain('ct-publication-card__content-top');
      expect(html).toContain('Live Top');
    });
  });
});
