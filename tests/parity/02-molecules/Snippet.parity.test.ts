import { describe, it, expect } from 'vitest';
import Snippet from '@civictheme/molecules/Snippet.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'snippet' };

const REQUIRED_KEY = 'Snippet Component renders with required attributes 1';
const OPTIONAL_KEY = 'Snippet Component renders with optional attributes 1';
const NO_TITLE_KEY = 'Snippet Component does not render when title is empty 1';
const LINK_TAGS_KEY = 'Snippet Component renders with link and tags 1';
const SLOTS_KEY = 'Snippet Component renders with content slots 1';

describe('Snippet', () => {
  parityCase(meta, REQUIRED_KEY, Snippet, {
    title: 'Snippet Title',
    summary: 'This is the summary of the snippet.',
  });

  parityCase(meta, OPTIONAL_KEY, Snippet, {
    contentTop: 'Top content',
    title: 'Snippet Title',
    summary: 'This is the summary of the snippet.',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    link: { text: 'Read more', url: 'https://example.com/read-more', isNewWindow: true, isExternal: true },
    tags: ['Tag1', 'Tag2'],
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, Snippet, {
    title: '',
  });

  parityCase(meta, LINK_TAGS_KEY, Snippet, {
    title: 'Snippet Title',
    link: { text: 'Read more', url: 'https://example.com/read-more' },
    tags: ['Tag1', 'Tag2'],
  });

  parityCase(meta, SLOTS_KEY, Snippet, {
    contentTop: 'Top content',
    title: 'Snippet Title',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_TITLE_KEY, LINK_TAGS_KEY, SLOTS_KEY]);

  // Task 14c: every Slot-documented prop except `tags` also has an Astro
  // slot that takes precedence over the string prop.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Snippet, { title: 'Snippet Title' });
      const viaSlot = await renderNormalised(Snippet, {}, { title: 'Snippet Title' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Snippet, { title: 'x', contentTop: 'Top content' });
      const viaSlot = await renderNormalised(Snippet, { title: 'x' }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentMiddle: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Snippet, { title: 'x', contentMiddle: 'Middle content' });
      const viaSlot = await renderNormalised(Snippet, { title: 'x' }, { contentMiddle: 'Middle content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('summary: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Snippet, { title: 'x', summary: 'A summary.' });
      const viaSlot = await renderNormalised(
        Snippet,
        { title: 'x' },
        {
          summary:
            '<div class="ct-paragraph ct-paragraph--no-margin ct-paragraph--regular ct-snippet__summary ct-theme-light">A summary.</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Snippet, { title: 'x', contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(Snippet, { title: 'x' }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a title slot alone (no string prop) still renders the component', async () => {
      const html = await renderNormalised(Snippet, {}, { title: 'Live Title' });
      expect(html).toContain('ct-snippet__title');
      expect(html).toContain('Live Title');
    });
  });
});
