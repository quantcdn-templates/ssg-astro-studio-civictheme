import { describe } from 'vitest';
import Snippet from '@civictheme/molecules/Snippet.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

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
});
