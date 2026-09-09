import { describe, it, expect } from 'vitest';
import Message from '@civictheme/organisms/Message.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'message' };

const ALL_KEY = 'Message Component renders with all attributes provided 1';
const DEFAULT_KEY = 'Message Component renders with default type and theme 1';
const NO_CONTENT_KEY = 'Message Component renders without content 1';
const NO_ROLE_KEY = 'Message Component renders without role 1';
const WITH_BG_KEY = 'Message Component renders with background 1';
const VS1_KEY = 'Message Component renders with vertical spacing 1';
const VS2_KEY = 'Message Component renders with vertical spacing 2';
const EMPTY_KEY = 'Message Component does not render when content and title are empty 1';

describe('Message', () => {
  parityCase(meta, ALL_KEY, Message, {
    theme: 'dark',
    type: 'error',
    title: 'this is title message.',
    content: 'This is an error message.',
    class: 'additional-class',
    withBackground: true,
    verticalSpacing: 'both',
  });

  parityCase(meta, DEFAULT_KEY, Message, {
    content: 'This is a default message.',
  });

  parityCase(meta, NO_CONTENT_KEY, Message, {
    theme: 'light',
    type: 'success',
    title: 'this is title message.',
    content: '',
    class: 'additional-class',
  });

  parityCase(meta, NO_ROLE_KEY, Message, {
    theme: 'light',
    type: 'success',
    content: 'This is a default message.',
    class: 'additional-class',
    hasAria: false,
  });

  parityCase(meta, WITH_BG_KEY, Message, {
    theme: 'light',
    type: 'success',
    content: 'This is a default message.',
    withBackground: true,
    hasAria: false,
  });

  parityCase(meta, VS1_KEY, Message, {
    theme: 'light',
    type: 'success',
    content: 'This is a default message.',
    verticalSpacing: 'both',
    hasAria: false,
  });

  parityCase(meta, VS2_KEY, Message, {
    theme: 'dark',
    type: 'error',
    title: 'this is title message.',
    verticalSpacing: 'both',
    class: 'additional-class',
  });

  parityCase(meta, EMPTY_KEY, Message, {
    theme: 'light',
    type: 'warning',
    content: '',
    title: '',
    class: '',
  });

  expectAllKeysCovered(meta, [
    ALL_KEY,
    DEFAULT_KEY,
    NO_CONTENT_KEY,
    NO_ROLE_KEY,
    WITH_BG_KEY,
    VS1_KEY,
    VS2_KEY,
    EMPTY_KEY,
  ]);

  // Task 14c: `title`/`content` also have Astro slots that take precedence
  // over the string props.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Message, { title: 'Message Title' });
      const viaSlot = await renderNormalised(Message, {}, { title: 'Message Title' });
      expect(viaSlot).toBe(viaProp);
    });

    it('content: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Message, { content: 'Some content.' });
      const viaSlot = await renderNormalised(
        Message,
        {},
        {
          content:
            '<div class="ct-message__content ct-paragraph ct-paragraph--regular ct-theme-light">Some content.</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('a title slot alone (no string prop) still renders the message', async () => {
      const html = await renderNormalised(Message, {}, { title: 'Live Title' });
      expect(html).toContain('ct-message__title');
      expect(html).toContain('Live Title');
    });
  });
});
