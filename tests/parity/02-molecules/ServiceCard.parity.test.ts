import { describe, it, expect } from 'vitest';
import ServiceCard from '@civictheme/molecules/ServiceCard.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'service-card' };

const REQUIRED_KEY = 'Service Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Service Card Component renders with optional attributes 1';
const NO_TITLE_KEY = 'Service Card Component does not render when title is empty 1';
const SLOTS_KEY = 'Service Card Component renders with content slots 1';

describe('ServiceCard', () => {
  parityCase(meta, REQUIRED_KEY, ServiceCard, {
    title: 'Service Card Title',
    links: [
      { text: 'Link 1', url: 'https://example.com/link1' },
      { text: 'Link 2', url: 'https://example.com/link2' },
    ],
  });

  parityCase(meta, OPTIONAL_KEY, ServiceCard, {
    contentTop: 'Top content',
    title: 'Service Card Title',
    links: [
      { text: 'Link 1', url: 'https://example.com/link1', isNewWindow: true, isExternal: true },
      { text: 'Link 2', url: 'https://example.com/link2' },
    ],
    contentBottom: 'Bottom content',
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, ServiceCard, {
    title: '',
    links: [
      { text: 'Link 1', url: 'https://example.com/link1' },
      { text: 'Link 2', url: 'https://example.com/link2' },
    ],
  });

  parityCase(meta, SLOTS_KEY, ServiceCard, {
    contentTop: 'Top content',
    title: 'Service Card Title',
    links: [
      { text: 'Link 1', url: 'https://example.com/link1' },
      { text: 'Link 2', url: 'https://example.com/link2' },
    ],
    contentBottom: 'Bottom content',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_TITLE_KEY, SLOTS_KEY]);

  // Task 14c: `contentTop`/`title`/`contentBottom` also have Astro slots
  // that take precedence over the string props.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(ServiceCard, { title: 'Card Title' });
      const viaSlot = await renderNormalised(
        ServiceCard,
        {},
        { title: '<h4 class="ct-heading ct-service-card__title ct-theme-light">Card Title</h4>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(ServiceCard, { title: 'x', contentTop: 'Top content' });
      const viaSlot = await renderNormalised(ServiceCard, { title: 'x' }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(ServiceCard, { title: 'x', contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(ServiceCard, { title: 'x' }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a title slot alone (no string prop) still renders the card', async () => {
      const html = await renderNormalised(ServiceCard, {}, { title: 'Live Title' });
      expect(html).toContain('ct-service-card__content');
      expect(html).toContain('Live Title');
    });
  });
});
