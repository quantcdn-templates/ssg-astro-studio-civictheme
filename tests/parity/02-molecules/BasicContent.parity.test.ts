import { describe, it, expect } from 'vitest';
import BasicContent from '@civictheme/molecules/BasicContent.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'basic-content' };

const REQUIRED_KEY = 'Basic Content Component renders with required attributes 1';
const OPTIONAL_KEY = 'Basic Content Component renders with optional attributes 1';
const UNCONTAINED_KEY = 'Basic Content Component renders without containment 1';
const EMPTY_KEY = 'Basic Content Component does not render when content is empty 1';

describe('BasicContent', () => {
  parityCase(meta, REQUIRED_KEY, BasicContent, {
    content: 'This is basic content.',
  });

  parityCase(meta, OPTIONAL_KEY, BasicContent, {
    content: 'This is basic content with options.',
    theme: 'dark',
    isContained: true,
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, UNCONTAINED_KEY, BasicContent, {
    content: 'This content is not contained.',
    isContained: false,
  });

  parityCase(meta, EMPTY_KEY, BasicContent, {
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, UNCONTAINED_KEY, EMPTY_KEY]);

  // Task 14c: `content` also has an Astro slot that takes precedence over
  // the string prop, both contained and uncontained.
  describe('slot vs string-prop parity', () => {
    it('content: slot renders identically to the string prop (contained)', async () => {
      const viaProp = await renderNormalised(BasicContent, { content: 'This is basic content.' });
      const viaSlot = await renderNormalised(BasicContent, {}, { content: 'This is basic content.' });
      expect(viaSlot).toBe(viaProp);
    });

    it('content: slot renders identically to the string prop (uncontained)', async () => {
      const viaProp = await renderNormalised(BasicContent, {
        content: 'This content is not contained.',
        isContained: false,
      });
      const viaSlot = await renderNormalised(
        BasicContent,
        { isContained: false },
        { content: 'This content is not contained.' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still renders the component', async () => {
      const html = await renderNormalised(BasicContent, {}, { content: 'Live content' });
      expect(html).toContain('ct-basic-content');
      expect(html).toContain('Live content');
    });
  });
});
