import { describe, it, expect } from 'vitest';
import NextStep from '@civictheme/molecules/NextStep.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'next-step' };

const REQUIRED_KEY = 'Next Steps Component renders with required attributes 1';
const OPTIONAL_KEY = 'Next Steps Component renders with optional attributes 1';
const NO_TITLE_KEY = 'Next Steps Component does not render when title is empty 1';
const LINK_KEY = 'Next Steps Component renders with link when provided 1';

describe('NextStep', () => {
  parityCase(meta, REQUIRED_KEY, NextStep, {
    title: 'Next Steps Title',
    content: 'This is the content of the next steps.',
  });

  parityCase(meta, OPTIONAL_KEY, NextStep, {
    contentTop: 'Top content',
    title: 'Next Steps Title',
    content: 'This is the content of the next steps.',
    link: { url: 'https://example.com', isNewWindow: true, isExternal: true },
    contentBottom: 'Bottom content',
    theme: 'dark',
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, NextStep, {
    title: '',
    content: 'This is the content of the next steps.',
  });

  parityCase(meta, LINK_KEY, NextStep, {
    title: 'Next Steps Title',
    content: 'This is the content of the next steps.',
    link: { url: 'https://example.com' },
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_TITLE_KEY, LINK_KEY]);

  // Task 14c: every Slot-documented prop also has an Astro slot that takes
  // precedence over the string prop.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop (no link)', async () => {
      const viaProp = await renderNormalised(NextStep, { title: 'Next Steps Title' });
      const viaSlot = await renderNormalised(
        NextStep,
        {},
        { title: '<h4 class="ct-heading ct-theme-light ct-next-step__title">Next Steps Title</h4>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('content: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NextStep, { title: 'x', content: 'Some content.' });
      const viaSlot = await renderNormalised(
        NextStep,
        { title: 'x' },
        {
          content:
            '<div class="ct-next-step__content ct-paragraph ct-paragraph--regular ct-theme-light">Some content.</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NextStep, { title: 'x', contentTop: 'Top content' });
      const viaSlot = await renderNormalised(NextStep, { title: 'x' }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(NextStep, { title: 'x', contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(NextStep, { title: 'x' }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a title slot alone (no string prop) still renders the component', async () => {
      const html = await renderNormalised(NextStep, {}, { title: 'Live Title' });
      expect(html).toContain('ct-next-step__inner');
      expect(html).toContain('Live Title');
    });
  });
});
