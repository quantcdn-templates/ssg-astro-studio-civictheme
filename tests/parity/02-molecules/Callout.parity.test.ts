import { describe, it, expect } from 'vitest';
import Callout from '@civictheme/molecules/Callout.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'callout' };

const REQUIRED_KEY = 'Callout Component renders with required attributes 1';
const OPTIONAL_KEY = 'Callout Component renders with optional attributes 1';
const MULTI_KEY = 'Callout Component renders with multiple links 1';

describe('Callout', () => {
  parityCase(meta, REQUIRED_KEY, Callout, {
    content: 'This is the main content of the callout.',
  });

  parityCase(meta, OPTIONAL_KEY, Callout, {
    contentTop: 'Top content',
    title: 'Callout Title',
    content: 'This is the main content of the callout.',
    links: [
      { text: 'Link 1', url: 'https://example.com', isNewWindow: true, isExternal: true },
      { text: 'Link 2', url: 'https://example.com' },
    ],
    contentBottom: 'Bottom content',
    theme: 'dark',
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, MULTI_KEY, Callout, {
    links: [
      { text: 'Link 1', url: 'https://example.com' },
      { text: 'Link 2', url: 'https://example.com' },
      { text: 'Link 3', url: 'https://example.com' },
    ],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, MULTI_KEY]);

  // Task 14c: `title`/`content`/`contentTop`/`contentBottom` also have
  // Astro slots that take precedence over the string props.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Callout, { title: 'Callout Title' });
      const viaSlot = await renderNormalised(
        Callout,
        {},
        { title: '<h4 class="ct-heading ct-callout__title ct-theme-light">Callout Title</h4>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('content: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Callout, { content: 'Sample content' });
      const viaSlot = await renderNormalised(
        Callout,
        {},
        {
          content:
            '<div class="ct-callout__content ct-paragraph ct-paragraph--no-margin ct-paragraph--regular ct-theme-light">Sample content</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Callout, { content: 'x', contentTop: 'Top content' });
      const viaSlot = await renderNormalised(Callout, { content: 'x' }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Callout, { content: 'x', contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(Callout, { content: 'x' }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(Callout, {}, { content: 'Live content' });
      expect(html).toContain('ct-callout__inner');
      expect(html).toContain('Live content');
    });
  });
});
