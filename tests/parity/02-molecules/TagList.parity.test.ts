import { describe, it, expect } from 'vitest';
import TagList from '@civictheme/molecules/TagList.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'tag-list' };

const REQUIRED_KEY = 'Tag List Component renders with required attributes 1';
const OPTIONAL_KEY = 'Tag List Component renders with optional attributes 1';
const EMPTY_KEY = 'Tag List Component does not render when tags are empty 1';
const SLOTS_KEY = 'Tag List Component renders with content slots 1';

describe('TagList', () => {
  parityCase(meta, REQUIRED_KEY, TagList, {
    tags: ['Tag 1', 'Tag 2', 'Tag 3'],
  });

  parityCase(meta, OPTIONAL_KEY, TagList, {
    tags: ['Tag 1', 'Tag 2'],
    theme: 'dark',
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'custom-class',
    contentTop: 'Top content',
    contentBottom: 'Bottom content',
  });

  parityCase(meta, EMPTY_KEY, TagList, {
    tags: [],
  });

  parityCase(meta, SLOTS_KEY, TagList, {
    tags: ['Tag 1', 'Tag 2'],
    contentTop: 'Top content',
    contentBottom: 'Bottom content',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, SLOTS_KEY]);

  // Task 14c: `contentTop`/`contentBottom` also have Astro slots that take
  // precedence over the string props.
  describe('slot vs string-prop parity', () => {
    const tags = ['Tag 1'];

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(TagList, { tags, contentTop: 'Top content' });
      const viaSlot = await renderNormalised(TagList, { tags }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(TagList, { tags, contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(TagList, { tags }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(TagList, { tags }, { contentTop: 'Live Top' });
      expect(html).toContain('ct-tag-list__content-top');
      expect(html).toContain('Live Top');
    });
  });
});
