import { describe, it, expect } from 'vitest';
import SubjectCard from '@civictheme/molecules/SubjectCard.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'subject-card' };

const REQUIRED_KEY = 'Subject Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Subject Card Component renders with optional attributes 1';
const NO_TITLE_KEY = 'Subject Card Component does not render when title is empty 1';
const LINK_IMAGE_KEY = 'Subject Card Component renders with link and image 1';
const SLOTS_KEY = 'Subject Card Component renders with content slots 1';

describe('SubjectCard', () => {
  parityCase(meta, REQUIRED_KEY, SubjectCard, {
    title: 'Subject Card Title',
  });

  parityCase(meta, OPTIONAL_KEY, SubjectCard, {
    title: 'Subject Card Title',
    imageOver: 'Image overlay content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image Alt Text' },
    link: { url: 'https://example.com/read-more', isNewWindow: true },
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, SubjectCard, {
    title: '',
  });

  parityCase(meta, LINK_IMAGE_KEY, SubjectCard, {
    title: 'Subject Card Title',
    link: { url: 'https://example.com/read-more' },
    image: { url: 'https://example.com/image.jpg', alt: 'Image Alt Text' },
  });

  parityCase(meta, SLOTS_KEY, SubjectCard, {
    title: 'Subject Card Title',
    imageOver: 'Image overlay content',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_TITLE_KEY, LINK_IMAGE_KEY, SLOTS_KEY]);

  // Task 14c: `title`/`imageOver` also have Astro slots that take
  // precedence over the string props.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(SubjectCard, { title: 'Card Title' });
      const viaSlot = await renderNormalised(SubjectCard, {}, { title: 'Card Title' });
      expect(viaSlot).toBe(viaProp);
    });

    it('imageOver: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(SubjectCard, { title: 'x', imageOver: 'Over content' });
      const viaSlot = await renderNormalised(SubjectCard, { title: 'x' }, { imageOver: 'Over content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a title slot alone (no string prop) still renders the card', async () => {
      const html = await renderNormalised(SubjectCard, {}, { title: 'Live Title' });
      expect(html).toContain('ct-subject-card__title');
      expect(html).toContain('Live Title');
    });
  });
});
