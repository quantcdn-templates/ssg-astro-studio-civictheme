import { describe } from 'vitest';
import Message from '@civictheme/organisms/Message.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

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
});
