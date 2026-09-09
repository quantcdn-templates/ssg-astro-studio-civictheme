import { describe, it, expect } from 'vitest';
import Popover from '@civictheme/atoms/Popover.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '01-atoms', name: 'popover' };

const REQUIRED_KEY = 'Popover Component renders with required attributes 1';
const OPTIONAL_KEY = 'Popover Component renders with optional attributes 1';
const EMPTY_KEY = 'Popover Component does not render when content is empty 1';

describe('Popover', () => {
  parityCase(meta, REQUIRED_KEY, Popover, {
    trigger: { text: 'Sample Trigger' },
    content: '<span>Sample content</span>',
  });

  parityCase(meta, OPTIONAL_KEY, Popover, {
    trigger: {
      text: 'Sample Trigger',
      url: 'https://example.com',
      isNewWindow: true,
      isExternal: true,
    },
    content: 'Sample content',
    group: 'sample-group',
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Popover, {
    trigger: { text: 'Sample Trigger' },
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);

  // Task 14c: `content`/`contentTop`/`contentBottom` also have Astro slots
  // that take precedence over the string props.
  describe('slot vs string-prop parity', () => {
    it('content: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Popover, {
        trigger: { text: 'Sample Trigger' },
        content: '<span>Sample content</span>',
      });
      const viaSlot = await renderNormalised(
        Popover,
        { trigger: { text: 'Sample Trigger' } },
        { content: '<span>Sample content</span>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Popover, {
        trigger: { text: 'Sample Trigger' },
        content: 'Sample content',
        contentTop: 'Top content',
      });
      const viaSlot = await renderNormalised(
        Popover,
        { trigger: { text: 'Sample Trigger' }, content: 'Sample content' },
        { contentTop: 'Top content' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Popover, {
        trigger: { text: 'Sample Trigger' },
        content: 'Sample content',
        contentBottom: 'Bottom content',
      });
      const viaSlot = await renderNormalised(
        Popover,
        { trigger: { text: 'Sample Trigger' }, content: 'Sample content' },
        { contentBottom: 'Bottom content' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('a content slot alone (no string prop) still renders the popover', async () => {
      const html = await renderNormalised(Popover, { trigger: { text: 'Sample Trigger' } }, { content: 'Live' });
      expect(html).toContain('ct-popover__content__inner');
      expect(html).toContain('Live');
    });
  });
});
